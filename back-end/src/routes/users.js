import { Router } from 'express';
import { isValidEmail, sendValidationErrors } from '../lib/httpValidation.js';
import { prisma } from '../lib/prisma.js';
import { sanitizeNullableText, sanitizeText } from '../lib/sanitizeInput.js';
import { serializeUserProfile } from '../lib/serializers.js';
import { requireAdminApiKey } from '../middleware/requireAdminApiKey.js';
import { notifyMemberJoined, notifyRoleUpdated } from '../services/notificationService.js';

export const usersRouter = Router();

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

usersRouter.get('/api/users', requireAdminApiKey, asyncRoute(async (_request, response) => {
  const users = await prisma.userProfile.findMany({
    orderBy: [{ role: 'asc' }, { joinedAt: 'desc' }],
  });

  response.json({ users: users.map(serializeUserProfile) });
}));

usersRouter.post('/api/users/sync', requireAdminApiKey, asyncRoute(async (request, response) => {
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

  const profile = existing
    ? await prisma.userProfile.update({
      where: { id: existing.id },
      data,
    })
    : await prisma.userProfile.create({
      data: {
        ...data,
        email,
        role: request.body.role === 'admin' ? 'admin' : 'player',
      },
    });

  if (!existing) {
    await notifyMemberJoined(profile);
  }

  response.status(201).json({ user: serializeUserProfile(profile) });
}));

usersRouter.patch('/api/users/:id/role', requireAdminApiKey, asyncRoute(async (request, response) => {
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
      staffRole: nextRole === 'admin' ? 'Admin' : 'Membro',
      updatedAt: new Date(),
    },
  });

  await prisma.adminAuditLog.create({
    data: {
      targetId: target.id,
      action: nextRole === 'admin' ? 'promote_admin' : 'remove_admin',
      beforeValue: { role: target.role, staffRole: target.staffRole },
      afterValue: { role: updated.role, staffRole: updated.staffRole },
    },
  });
  await notifyRoleUpdated(updated, nextRole);

  response.json({ user: serializeUserProfile(updated) });
}));
