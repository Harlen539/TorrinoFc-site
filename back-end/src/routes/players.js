import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { sanitizeNullableText, sanitizeText } from '../lib/sanitizeInput.js';
import { serializePlayer } from '../lib/serializers.js';
import { requireAdminApiKey } from '../middleware/requireAdminApiKey.js';
import { notifyStatisticsUpdated } from '../services/notificationService.js';

export const playersRouter = Router();

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
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

playersRouter.get('/api/players', asyncRoute(async (_request, response) => {
  const players = await prisma.playerProfile.findMany({
    where: {
      teamName: 'Torinno FC',
      status: { not: 'Removido' },
    },
    include: { stats: true },
    orderBy: [{ createdAt: 'desc' }],
  });

  response.json({ players: players.map(serializePlayer) });
}));

playersRouter.post('/api/players', requireAdminApiKey, asyncRoute(async (request, response) => {
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

  response.status(201).json({ player: serializePlayer(player) });
}));

playersRouter.put('/api/players/:id', requireAdminApiKey, asyncRoute(async (request, response) => {
  const player = await prisma.playerProfile.update({
    where: { id: request.params.id },
    data: { ...makePlayerData(request.body), updatedAt: new Date() },
    include: { stats: true },
  });

  response.json({ player: serializePlayer(player) });
}));

playersRouter.put('/api/players/:id/stats', requireAdminApiKey, asyncRoute(async (request, response) => {
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

  response.json({ player: serializePlayer(updated) });
}));

playersRouter.delete('/api/players/:id', requireAdminApiKey, asyncRoute(async (request, response) => {
  await prisma.playerProfile.update({
    where: { id: request.params.id },
    data: { status: 'Removido', updatedAt: new Date() },
  });

  response.status(204).send();
}));
