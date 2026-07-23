import { Router } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { sanitizeNullableText, sanitizeText } from '../lib/sanitizeInput.js';
import { serializePlayer } from '../lib/serializers.js';
import { requireAdminUser, requirePermission } from '../middleware/requireAdminApiKey.js';
import { notifyStatisticsUpdated } from '../services/notificationService.js';
import { recordActivity } from '../services/activityService.js';
import { ensurePlayerForUser, ensurePlayersForExistingUsers, ensureStatsForExistingPlayers } from '../services/playerSyncService.js';

export const playersRouter = Router();

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function makePlayerData(body) {
  return {
    teamName: 'Torinno FC',
    userId: sanitizeNullableText(body.user_id || body.userId, { maxLength: 80 }),
    fullName: sanitizeText(body.full_name || body.fullName || body.nickname, { maxLength: 120 }),
    nickname: sanitizeText(body.nickname || body.full_name || body.fullName, { maxLength: 80 }),
    position: sanitizeText(body.position, { maxLength: 60, fallback: 'Sem posicao' }),
    shirtNumber: Math.min(numberOrZero(body.shirt || body.shirtNumber), 999),
    dominantFoot: sanitizeNullableText(body.foot || body.dominantFoot, { maxLength: 40 }),
    bio: sanitizeNullableText(body.bio, { maxLength: 700 }),
    status: sanitizeText(body.status, { maxLength: 32, fallback: 'Ativo' }),
    instagram: sanitizeNullableText(body.instagram, { maxLength: 120 }),
    avatarUrl: sanitizeNullableText(body.avatar || body.avatarUrl, { maxLength: 1200 }),
    photoUrl: sanitizeNullableText(body.photo || body.photoUrl, { maxLength: 1200 }),
  };
}

function makeStatsData(body) {
  return {
    goals: numberOrZero(body.goals),
    assists: numberOrZero(body.assists),
    ballRecoveries: numberOrZero(body.recoveries || body.ballRecoveries),
    shots: numberOrZero(body.shots),
    accuratePasses: numberOrZero(body.passes || body.accuratePasses),
    tackles: numberOrZero(body.tackles),
    interceptions: numberOrZero(body.interceptions),
    matches: numberOrZero(body.matches),
    wins: numberOrZero(body.wins),
    draws: numberOrZero(body.draws),
    losses: numberOrZero(body.losses),
    yellowCards: numberOrZero(body.yellow || body.yellowCards),
    redCards: numberOrZero(body.red || body.redCards),
    averageRating: Math.min(numberOrZero(body.rating || body.averageRating), 10),
    notes: sanitizeNullableText(body.notes, { maxLength: 700 }),
    updatedAt: new Date(),
  };
}

function makeFallbackStats() {
  return {
    goals: 0,
    assists: 0,
    recoveries: 0,
    shots: 0,
    passes: 0,
    tackles: 0,
    interceptions: 0,
    matches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    yellow: 0,
    red: 0,
    rating: 0,
    notes: '',
  };
}

function authUserToPlayer(user) {
  const metadata = user.user_metadata || {};
  const fullName = sanitizeText(metadata.name || metadata.fullName || user.email?.split('@')[0], {
    maxLength: 120,
    fallback: 'Jogador TorinnoFC',
  });
  const nickname = sanitizeText(metadata.nickname || fullName, {
    maxLength: 80,
    fallback: fullName,
  });
  const shirt = Math.min(numberOrZero(metadata.shirt || metadata.shirtNumber || 10), 999);

  return {
    id: `auth-player-${user.id}`,
    userId: user.id,
    email: String(user.email || '').trim().toLowerCase(),
    fullName,
    nickname,
    position: sanitizeText(metadata.position, { maxLength: 60, fallback: 'Meio-campo' }),
    shirt,
    foot: '',
    status: 'Ativo',
    role: 'Jogador',
    avatar: sanitizeNullableText(metadata.avatarUrl || metadata.avatar_url, { maxLength: 1200 }) || '',
    photo: sanitizeNullableText(metadata.photo || metadata.photoUrl || metadata.avatarUrl, { maxLength: 1200 }) || '',
    bio: sanitizeNullableText(metadata.bio, { maxLength: 700 }) || 'Jogador cadastrado na plataforma TorinnoFC.',
    instagram: '',
    localOnly: true,
    source: 'supabase-auth',
    createdAt: user.created_at || new Date().toISOString(),
    updatedAt: user.updated_at || user.last_sign_in_at || user.created_at || new Date().toISOString(),
    stats: makeFallbackStats(),
  };
}

export async function fetchSupabaseAuthPlayers() {
  if (!env.supabase.url || !env.supabase.secretKey) {
    return [];
  }

  const baseUrl = env.supabase.url.replace(/\/$/, '');
  const perPage = 200;
  const users = [];

  for (let page = 1; page <= 25; page += 1) {
    const response = await fetch(`${baseUrl}/auth/v1/admin/users?page=${page}&per_page=${perPage}`, {
      headers: {
        apikey: env.supabase.secretKey,
        Authorization: `Bearer ${env.supabase.secretKey}`,
      },
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.msg || payload.error || 'Nao foi possivel listar usuarios do Supabase Auth.');
    }

    const payload = await response.json();
    const pageUsers = Array.isArray(payload.users) ? payload.users : [];
    users.push(...pageUsers);
    if (pageUsers.length < perPage) break;
  }

  return users
    .filter((user) => user?.id && user.email && !user.deleted_at)
    .map(authUserToPlayer);
}

export async function syncSupabaseAuthUsersToDatabase(client = prisma) {
  const authPlayers = await fetchSupabaseAuthPlayers();
  if (!authPlayers.length) return 0;

  let synced = 0;
  let hasAdmin = await client.userProfile.count({ where: { role: 'admin', accountStatus: 'active' } }) > 0;

  for (const authPlayer of authPlayers) {
    const email = String(authPlayer.email || '').trim().toLowerCase();
    const filters = [
      ...(isUuid(authPlayer.userId) ? [{ id: authPlayer.userId }] : []),
      ...(email ? [{ email }] : []),
    ];

    if (!filters.length) continue;

    await client.$transaction(async (tx) => {
      const existing = await tx.userProfile.findFirst({
        where: { OR: filters },
        include: { playerProfile: true },
      });
      const makeFounder = !hasAdmin;
      const data = {
        name: authPlayer.fullName,
        nickname: authPlayer.nickname,
        email,
        accountStatus: existing?.accountStatus || 'active',
        avatarUrl: authPlayer.photo || authPlayer.avatar || null,
        updatedAt: new Date(),
        ...(makeFounder ? { role: 'admin', staffRole: 'Fundador' } : {}),
      };
      const profile = existing
        ? await tx.userProfile.update({
          where: { id: existing.id },
          data,
          include: { playerProfile: true },
        })
        : await tx.userProfile.create({
          data: {
            ...(isUuid(authPlayer.userId) ? { id: authPlayer.userId } : {}),
            ...data,
            role: makeFounder ? 'admin' : 'player',
            staffRole: makeFounder ? 'Fundador' : 'Jogador',
          },
          include: { playerProfile: true },
        });

      const shouldHavePlayer = !existing || profile.role !== 'admin' || Boolean(profile.playerProfile);
      if (shouldHavePlayer) {
        await ensurePlayerForUser(tx, profile, {
          name: authPlayer.fullName,
          nickname: authPlayer.nickname,
          position: authPlayer.position,
          shirt: authPlayer.shirt,
          avatarUrl: authPlayer.avatar,
          photo: authPlayer.photo,
          bio: authPlayer.bio,
        });
      }

      if (makeFounder) hasAdmin = true;
      synced += 1;
    });
  }

  return synced;
}

playersRouter.get('/api/players', asyncRoute(async (_request, response) => {
  try {
    await ensurePlayersForExistingUsers(prisma);
    await ensureStatsForExistingPlayers(prisma);

    const players = await prisma.playerProfile.findMany({
      where: {
        teamName: 'Torinno FC',
        status: { not: 'Removido' },
      },
      include: { stats: true },
      orderBy: [{ createdAt: 'desc' }],
    });

    response.json({ players: players.map(serializePlayer), source: 'database' });
  } catch (error) {
    console.error('[players] Banco indisponivel; usando fallback do Supabase Auth:', error);
    const players = await fetchSupabaseAuthPlayers();
    response.set('x-data-source', 'supabase-auth-fallback');
    response.json({
      players,
      source: 'supabase-auth-fallback',
      warning: 'Banco indisponivel. Exibindo cadastros do Supabase Auth ate o Postgres voltar.',
    });
  }
}));

playersRouter.post('/api/players', requirePermission('createPlayer'), asyncRoute(async (request, response) => {
  const data = makePlayerData(request.body);
  if (!data.fullName || !data.nickname) {
    response.status(400).json({ error: 'Nome e apelido sao obrigatorios.' });
    return;
  }

  const player = await prisma.playerProfile.create({
    data: {
      ...data,
      stats: { create: makeStatsData(request.body.stats || {}) },
    },
    include: { stats: true },
  });

  await recordActivity({
    type: 'player_created',
    actorId: request.userProfile?.id || null,
    actorName: request.userProfile?.nickname || request.userProfile?.name || '',
    message: `${player.nickname} foi cadastrado no elenco.`,
    relatedEntityType: 'player',
    relatedEntityId: player.id,
    actionUrl: '/players',
  });

  response.status(201).json({ player: serializePlayer(player) });
}));

playersRouter.put('/api/players/:id', requirePermission('editPlayer'), asyncRoute(async (request, response) => {
  const player = await prisma.playerProfile.update({
    where: { id: request.params.id },
    data: { ...makePlayerData(request.body), updatedAt: new Date() },
    include: { stats: true },
  });
  await recordActivity({
    type: 'player_updated',
    actorId: request.userProfile?.id || null,
    actorName: request.userProfile?.nickname || request.userProfile?.name || '',
    message: `${player.nickname} teve o perfil atualizado.`,
    relatedEntityType: 'player',
    relatedEntityId: player.id,
    actionUrl: '/players',
  });

  response.json({ player: serializePlayer(player) });
}));

playersRouter.put('/api/players/:id/stats', requirePermission('editAnyPerformance'), asyncRoute(async (request, response) => {
  const player = await prisma.playerProfile.findUnique({ where: { id: request.params.id } });
  if (!player) {
    response.status(404).json({ error: 'Jogador nao encontrado.' });
    return;
  }

  const stats = await prisma.playerStats.upsert({
    where: { playerId: request.params.id },
    update: makeStatsData(request.body),
    create: { playerId: request.params.id, ...makeStatsData(request.body) },
  });

  if (player.userId) {
    const profile = await prisma.userProfile.findUnique({ where: { id: player.userId } }).catch(() => null);
    if (profile?.email) {
      await notifyStatisticsUpdated(profile, `${stats.goals} gols, ${stats.assists} assistencias e ${stats.ballRecoveries} roubadas`);
    }
  }

  const updated = await prisma.playerProfile.findUnique({
    where: { id: request.params.id },
    include: { stats: true },
  });
  await recordActivity({
    type: 'player_stats_updated',
    actorId: request.userProfile?.id || null,
    actorName: request.userProfile?.nickname || request.userProfile?.name || '',
    message: `${updated?.nickname || player.nickname} teve estatisticas atualizadas.`,
    relatedEntityType: 'player',
    relatedEntityId: request.params.id,
    actionUrl: '/players',
    metadata: {
      goals: stats.goals,
      assists: stats.assists,
      recoveries: stats.ballRecoveries,
      rating: Number(stats.averageRating || 0),
    },
  });

  response.json({ player: serializePlayer(updated) });
}));

playersRouter.delete('/api/players/:id', requireAdminUser, asyncRoute(async (request, response) => {
  const existing = await prisma.playerProfile.findUnique({
    where: { id: request.params.id },
    include: { user: true },
  });
  if (!existing) {
    response.status(404).json({ error: 'Jogador nao encontrado.' });
    return;
  }
  if (existing.userId === request.userProfile.id) {
    response.status(409).json({ error: 'Voce nao pode remover o proprio acesso.' });
    return;
  }
  if (existing.user?.staffRole === 'Fundador') {
    response.status(403).json({ error: 'O acesso do Fundador nao pode ser removido.' });
    return;
  }
  if (existing.user?.role === 'admin') {
    const adminCount = await prisma.userProfile.count({ where: { role: 'admin', accountStatus: 'active' } });
    if (adminCount <= 1) {
      response.status(409).json({ error: 'Nao e possivel remover o ultimo administrador ativo.' });
      return;
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.playerProfile.update({
      where: { id: request.params.id },
      data: { status: 'Removido', updatedAt: new Date() },
    });

    if (existing.userId) {
      await tx.userProfile.update({
        where: { id: existing.userId },
        data: { accountStatus: 'removed', updatedAt: new Date() },
      });
    }
  });

  await prisma.adminAuditLog.create({
    data: {
      actorId: request.userProfile?.id || null,
      targetId: request.params.id,
      action: 'remove_player',
      beforeValue: existing ? { status: existing.status, nickname: existing.nickname } : null,
      afterValue: { status: 'Removido' },
    },
  });
  await recordActivity({
    type: 'player_removed',
    actorId: request.userProfile?.id || null,
    actorName: request.userProfile?.nickname || request.userProfile?.name || '',
    message: `${existing?.nickname || 'Jogador'} foi removido do elenco.`,
    relatedEntityType: 'player',
    relatedEntityId: request.params.id,
    actionUrl: '/players',
  });

  response.status(204).send();
}));
