import { Router } from 'express';
import { isValidEmail, sendValidationErrors } from '../lib/httpValidation.js';
import { prisma } from '../lib/prisma.js';
import { sanitizeNullableText, sanitizeText } from '../lib/sanitizeInput.js';
import { serializeUserProfile } from '../lib/serializers.js';
import { requireAdminUser } from '../middleware/requireAdminApiKey.js';
import { notifyMemberJoined, notifyRoleUpdated } from '../services/notificationService.js';

export const usersRouter = Router();

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(String(value || ''));
}

usersRouter.get('/api/users', asyncRoute(async (_request, response) => {
  const users = await prisma.userProfile.findMany({
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
    staffRole: sanitizeNullableText(request.body.staffRole, { maxLength: 80 }),
    accountStatus: sanitizeText(request.body.accountStatus, { maxLength: 32, fallback: 'active' }),
    updatedAt: new Date(),
  };
  const requestedId = isUuid(request.body.id) ? request.body.id : undefined;
  const role = request.body.role === 'admin' ? 'admin' : 'player';

  const profile = existing
    ? await prisma.userProfile.update({
      where: { id: existing.id },
      data,
    })
    : await prisma.userProfile.create({
      data: {
        ...(requestedId ? { id: requestedId } : {}),
        ...data,
        email,
        role,
        staffRole: data.staffRole || (role === 'admin' ? 'Admin' : 'Jogador'),
      },
    });

  if (!existing) {
    await notifyMemberJoined(profile);
  }

  response.status(201).json({ user: serializeUserProfile(profile) });
}));

usersRouter.patch('/api/users/:id/role', requireAdminUser, asyncRoute(async (request, response) => {
  const nextRole = request.body.role === 'admin' ? 'admin' : 'player';
  const target = await prisma.userProfile.findUnique({ where: { id: request.params.id } });

  if (!target) {
    response.status(404).json({ error: 'Usuario nao encontrado.' });
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
      staffRole: nextRole === 'admin' ? 'Admin' : 'Jogador',
      updatedAt: new Date(),
    },
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

  response.json({ user: serializeUserProfile(updated) });
}));
