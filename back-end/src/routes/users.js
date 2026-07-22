import { Router } from 'express';
import { createHash, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import { isValidEmail, sendValidationErrors } from '../lib/httpValidation.js';
import { prisma } from '../lib/prisma.js';
import { sanitizeNullableText, sanitizeText } from '../lib/sanitizeInput.js';
import { serializePlayer, serializeUserProfile } from '../lib/serializers.js';
import { requireAdminUser, requireAuthenticatedProfile, requireAuthenticatedUser, requirePermission } from '../middleware/requireAdminApiKey.js';
import { ensurePlayerForUser } from '../services/playerSyncService.js';
import { notifyMemberJoined, notifyRoleUpdated } from '../services/notificationService.js';
import { recordActivity } from '../services/activityService.js';
import { getRolePermissions } from '../services/settingsService.js';

export const usersRouter = Router();
const promotionAttempts = new Map();
const promotionWindowMs = 15 * 60 * 1000;
const maxPromotionAttempts = 5;

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(String(value || ''));
}

function passwordMatches(value) {
  const received = Buffer.from(createHash('sha256').update(String(value || '')).digest('hex'));
  const expected = Buffer.from(env.adminPromotionPasswordHash);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function getPromotionAttempt(profileId) {
  const attempt = promotionAttempts.get(profileId);
  if (!attempt || Date.now() - attempt.startedAt >= promotionWindowMs) {
    const fresh = { count: 0, startedAt: Date.now() };
    promotionAttempts.set(profileId, fresh);
    return fresh;
  }
  return attempt;
}

usersRouter.get('/api/users', requireAdminUser, asyncRoute(async (_request, response) => {
  const users = await prisma.userProfile.findMany({
    include: { playerProfile: true },
    orderBy: [{ role: 'asc' }, { joinedAt: 'desc' }],
  });

  response.json({ users: users.map(serializeUserProfile) });
}));

usersRouter.post('/api/users/sync', requireAuthenticatedProfile, asyncRoute(async (request, response) => {
  const email = String(request.body.email || '').trim().toLowerCase();
  const errors = [];

  if (!sanitizeText(request.body.name, { maxLength: 120 })) errors.push('Nome e obrigatorio.');
  if (!isValidEmail(email)) errors.push('E-mail invalido.');

  if (errors.length) {
    sendValidationErrors(response, errors);
    return;
  }

  if (email !== String(request.auth?.email || '').trim().toLowerCase()) {
    response.status(403).json({ error: 'A sessao nao pertence ao e-mail informado.' });
    return;
  }

  const existing = await prisma.userProfile.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
  const wasPendingEmail = existing?.accountStatus === 'pending_email';
  const data = {
    name: sanitizeText(request.body.name, { maxLength: 120 }),
    nickname: sanitizeNullableText(request.body.nickname, { maxLength: 80 }),
    accountStatus: existing?.accountStatus === 'pending_email' ? 'active' : (existing?.accountStatus || 'active'),
    updatedAt: new Date(),
    ...(request.body.avatarUrl || request.body.photo
      ? { avatarUrl: sanitizeNullableText(request.body.avatarUrl || request.body.photo, { maxLength: 1200 }) }
      : {}),
  };
  const requestedId = isUuid(request.body.id) ? request.body.id : undefined;

  const result = await prisma.$transaction(async (tx) => {
    const profile = existing
      ? await tx.userProfile.update({
        where: { id: existing.id },
        data,
        include: { playerProfile: true },
      })
      : await tx.userProfile.create({
        data: {
          ...(requestedId ? { id: requestedId } : {}),
          ...data,
          email,
          role: 'player',
          staffRole: 'Jogador',
        },
        include: { playerProfile: true },
      });

    const shouldHavePlayer = profile.role !== 'admin' || Boolean(profile.playerProfile);
    const player = shouldHavePlayer ? await ensurePlayerForUser(tx, profile, request.body) : null;
    const syncedProfile = await tx.userProfile.findUnique({
      where: { id: profile.id },
      include: { playerProfile: true },
    });

    return { profile: syncedProfile, player };
  });

  if (!existing || wasPendingEmail) {
    await notifyMemberJoined(result.profile);
    await recordActivity({
      type: 'member_joined',
      actorId: result.profile.id,
      actorName: result.profile.nickname || result.profile.name,
      message: `${result.profile.nickname || result.profile.name} entrou para o clube.`,
      relatedEntityType: 'user',
      relatedEntityId: result.profile.id,
      actionUrl: '/players',
    });
  } else if (request.body.profileUpdate) {
    await recordActivity({
      type: 'profile_updated',
      actorId: result.profile.id,
      actorName: result.profile.nickname || result.profile.name,
      message: `${result.profile.nickname || result.profile.name} atualizou o perfil no elenco.`,
      relatedEntityType: 'player',
      relatedEntityId: result.player?.id || result.profile.playerProfile?.id || null,
      actionUrl: '/players',
    });
  }

  const permissions = await getRolePermissions(prisma);
  response.status(201).json({
    user: serializeUserProfile(result.profile),
    player: result.player ? serializePlayer(result.player) : null,
    playerId: result.player?.id || '',
    role: result.profile.role,
    staffRole: result.profile.staffRole || (result.profile.role === 'admin' ? 'Admin' : 'Jogador'),
    permissions: permissions[result.profile.role] || {},
  });
}));

usersRouter.post('/api/users/me/promote', requireAuthenticatedUser, asyncRoute(async (request, response) => {
  const profile = request.userProfile;
  if (profile.role === 'admin') {
    response.json({ user: serializeUserProfile(profile) });
    return;
  }

  const attempt = getPromotionAttempt(profile.id);
  if (attempt.count >= maxPromotionAttempts) {
    response.status(429).json({ error: 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.' });
    return;
  }

  if (!passwordMatches(request.body.password)) {
    attempt.count += 1;
    response.status(401).json({ error: 'Senha administrativa incorreta.' });
    return;
  }

  promotionAttempts.delete(profile.id);
  const updated = await prisma.userProfile.update({
    where: { id: profile.id },
    data: { role: 'admin', staffRole: 'Admin', updatedAt: new Date() },
    include: { playerProfile: true },
  });

  await prisma.adminAuditLog.create({
    data: {
      actorId: profile.id,
      targetId: profile.id,
      action: 'self_promote_admin',
      beforeValue: { role: profile.role, staffRole: profile.staffRole },
      afterValue: { role: updated.role, staffRole: updated.staffRole },
    },
  });
  await notifyRoleUpdated(updated, 'admin');
  await recordActivity({
    type: 'admin_promoted',
    actorId: updated.id,
    actorName: updated.nickname || updated.name,
    message: `${updated.nickname || updated.name} ativou o acesso administrativo.`,
    relatedEntityType: 'user',
    relatedEntityId: updated.id,
    actionUrl: '/admin',
  });

  response.json({ user: serializeUserProfile(updated) });
}));

usersRouter.patch('/api/users/:id/role', requirePermission('managePermissions'), asyncRoute(async (request, response) => {
  const nextRole = request.body.role === 'admin' ? 'admin' : 'player';
  const target = await prisma.userProfile.findUnique({ where: { id: request.params.id } });

  if (!target) {
    response.status(404).json({ error: 'Usuario nao encontrado.' });
    return;
  }

  if (target.staffRole === 'Fundador' && request.userProfile?.id !== target.id) {
    response.status(403).json({ error: 'O Fundador nao pode ser rebaixado por outro administrador.' });
    return;
  }

  if (target.role === 'admin' && nextRole !== 'admin') {
    const adminCount = await prisma.userProfile.count({ where: { role: 'admin', accountStatus: 'active' } });
    if (adminCount <= 1) {
      response.status(409).json({ error: 'Nao e possivel remover o ultimo administrador ativo.' });
      return;
    }
  }

  const updated = await prisma.userProfile.update({
    where: { id: request.params.id },
    data: {
      role: nextRole,
      staffRole: target.staffRole === 'Fundador' ? 'Fundador' : nextRole === 'admin' ? 'Admin' : 'Jogador',
      updatedAt: new Date(),
    },
    include: { playerProfile: true },
  });

  await prisma.adminAuditLog.create({
    data: {
      actorId: request.userProfile?.id || null,
      targetId: target.id,
      action: nextRole === 'admin' ? 'promote_admin' : 'remove_admin',
      beforeValue: { role: target.role, staffRole: target.staffRole },
      afterValue: { role: updated.role, staffRole: updated.staffRole },
    },
  });
  await notifyRoleUpdated(updated, nextRole);
  await recordActivity({
    type: nextRole === 'admin' ? 'admin_promoted' : 'admin_removed',
    actorId: request.userProfile?.id || null,
    actorName: request.userProfile?.nickname || request.userProfile?.name || '',
    message: `${updated.nickname || updated.name} agora e ${updated.staffRole || (nextRole === 'admin' ? 'Admin' : 'Jogador')}.`,
    relatedEntityType: 'user',
    relatedEntityId: updated.id,
    actionUrl: '/settings',
  });

  response.json({ user: serializeUserProfile(updated) });
}));

usersRouter.patch('/api/users/:id/status', requireAdminUser, asyncRoute(async (request, response) => {
  const nextStatus = request.body.status === 'active' ? 'active' : 'removed';
  const target = await prisma.userProfile.findUnique({
    where: { id: request.params.id },
    include: { playerProfile: true },
  });

  if (!target) {
    response.status(404).json({ error: 'Usuario nao encontrado.' });
    return;
  }
  if (target.id === request.userProfile.id && nextStatus === 'removed') {
    response.status(409).json({ error: 'Voce nao pode remover o proprio acesso.' });
    return;
  }
  if (target.staffRole === 'Fundador' && nextStatus === 'removed') {
    response.status(403).json({ error: 'O acesso do Fundador nao pode ser removido.' });
    return;
  }
  if (target.role === 'admin' && nextStatus === 'removed') {
    const adminCount = await prisma.userProfile.count({ where: { role: 'admin', accountStatus: 'active' } });
    if (adminCount <= 1) {
      response.status(409).json({ error: 'Nao e possivel remover o ultimo administrador ativo.' });
      return;
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (target.playerProfile) {
      await tx.playerProfile.update({
        where: { id: target.playerProfile.id },
        data: { status: nextStatus === 'active' ? 'Ativo' : 'Removido', updatedAt: new Date() },
      });
    }
    return tx.userProfile.update({
      where: { id: target.id },
      data: { accountStatus: nextStatus, updatedAt: new Date() },
      include: { playerProfile: true },
    });
  });

  await prisma.adminAuditLog.create({
    data: {
      actorId: request.userProfile.id,
      targetId: target.id,
      action: nextStatus === 'active' ? 'restore_platform_access' : 'remove_platform_access',
      beforeValue: { accountStatus: target.accountStatus },
      afterValue: { accountStatus: updated.accountStatus },
    },
  });

  response.json({ user: serializeUserProfile(updated) });
}));
