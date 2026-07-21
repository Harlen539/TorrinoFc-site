import { Router } from 'express';
import { isValidEmail, sendValidationErrors } from '../lib/httpValidation.js';
import { prisma } from '../lib/prisma.js';
import { sanitizeNullableText, sanitizeText } from '../lib/sanitizeInput.js';
import { serializePlayer, serializeUserProfile } from '../lib/serializers.js';
import { requireAdminUser, requirePermission } from '../middleware/requireAdminApiKey.js';
import { ensurePlayerForUser } from '../services/playerSyncService.js';
import { notifyMemberJoined, notifyRoleUpdated } from '../services/notificationService.js';
import { recordActivity } from '../services/activityService.js';

export const usersRouter = Router();

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(String(value || ''));
}

usersRouter.get('/api/users', requireAdminUser, asyncRoute(async (_request, response) => {
  const users = await prisma.userProfile.findMany({
    include: { playerProfile: true },
    orderBy: [{ role: 'asc' }, { joinedAt: 'desc' }],
  });

  response.json({ users: users.map(serializeUserProfile) });
}));

usersRouter.post('/api/users/sync', asyncRoute(async (request, response) => {
  const email = String(request.body.email || '').trim().toLowerCase();
  const errors = [];

  if (!sanitizeText(request.body.name, { maxLength: 120 })) errors.push('Nome e obrigatorio.');
  if (!isValidEmail(email)) errors.push('E-mail invalido.');

  if (errors.length) {
    sendValidationErrors(response, errors);
    return;
  }

  const existing = await prisma.userProfile.findFirst({ where: { email } });
  const data = {
    name: sanitizeText(request.body.name, { maxLength: 120 }),
    nickname: sanitizeNullableText(request.body.nickname, { maxLength: 80 }),
    accountStatus: sanitizeText(request.body.accountStatus, { maxLength: 32, fallback: 'active' }),
    updatedAt: new Date(),
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

    const player = await ensurePlayerForUser(tx, profile, request.body);
    const syncedProfile = await tx.userProfile.findUnique({
      where: { id: profile.id },
      include: { playerProfile: true },
    });

    return { profile: syncedProfile, player };
  });

  if (!existing) {
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
  }

  response.status(201).json({
    user: serializeUserProfile(result.profile),
    player: result.player ? serializePlayer(result.player) : null,
    playerId: result.player?.id || '',
    role: result.profile.role,
    staffRole: result.profile.staffRole || (result.profile.role === 'admin' ? 'Admin' : 'Jogador'),
  });
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
