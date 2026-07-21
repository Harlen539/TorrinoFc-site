import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAdminUser, requireAuthenticatedUser } from '../middleware/requireAdminApiKey.js';
import {
  defaultClubSettings,
  defaultPersonalSettings,
  defaultRolePermissions,
  getClubSettings,
  getPersonalSettings,
  getRolePermissions,
  sanitizeSettings,
} from '../services/settingsService.js';

export const settingsRouter = Router();

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

settingsRouter.get('/api/settings/me', requireAuthenticatedUser, asyncRoute(async (request, response) => {
  const settings = await getPersonalSettings(prisma, request.userProfile.id);
  response.json({ settings });
}));

settingsRouter.put('/api/settings/me', requireAuthenticatedUser, asyncRoute(async (request, response) => {
  const data = sanitizeSettings(defaultPersonalSettings, request.body || {});
  const settings = await prisma.userSetting.upsert({
    where: { userId: request.userProfile.id },
    update: { data, updatedAt: new Date() },
    create: { userId: request.userProfile.id, data },
  });

  response.json({ settings: sanitizeSettings(defaultPersonalSettings, settings.data) });
}));

settingsRouter.get('/api/admin/settings', requireAdminUser, asyncRoute(async (_request, response) => {
  const settings = await getClubSettings(prisma);
  response.json({ settings });
}));

settingsRouter.put('/api/admin/settings', requireAdminUser, asyncRoute(async (request, response) => {
  const nextSettings = {
    rules: sanitizeSettings(defaultClubSettings.rules, request.body.rules),
    notifications: sanitizeSettings(defaultClubSettings.notifications, request.body.notifications),
    matches: sanitizeSettings(defaultClubSettings.matches, request.body.matches),
    players: sanitizeSettings(defaultClubSettings.players, request.body.players),
  };

  const before = await getClubSettings(prisma);

  await prisma.$transaction(async (tx) => {
    for (const [key, value] of Object.entries(nextSettings)) {
      await tx.clubSetting.upsert({
        where: { key },
        update: { value, updatedBy: request.userProfile.id, updatedAt: new Date() },
        create: { key, value, updatedBy: request.userProfile.id },
      });
    }

    await tx.adminAuditLog.create({
      data: {
        actorId: request.userProfile.id,
        action: 'update_club_settings',
        beforeValue: before,
        afterValue: nextSettings,
      },
    });
  });

  response.json({ settings: nextSettings });
}));

settingsRouter.get('/api/admin/permissions', requireAdminUser, asyncRoute(async (_request, response) => {
  const permissions = await getRolePermissions(prisma);
  response.json({ permissions });
}));

settingsRouter.put('/api/admin/permissions/:role/:permission', requireAdminUser, asyncRoute(async (request, response) => {
  const role = String(request.params.role || '').trim();
  const permissionKey = String(request.params.permission || '').trim();

  if (!defaultRolePermissions[role] || !(permissionKey in defaultRolePermissions[role])) {
    response.status(400).json({ error: 'Permissao invalida.' });
    return;
  }

  const enabled = request.body.enabled === true;
  const before = await prisma.rolePermission.findUnique({
    where: { role_permissionKey: { role, permissionKey } },
  });

  const permission = await prisma.$transaction(async (tx) => {
    const updated = await tx.rolePermission.upsert({
      where: { role_permissionKey: { role, permissionKey } },
      update: { enabled, updatedBy: request.userProfile.id, updatedAt: new Date() },
      create: { role, permissionKey, enabled, updatedBy: request.userProfile.id },
    });

    await tx.adminAuditLog.create({
      data: {
        actorId: request.userProfile.id,
        action: 'update_permission',
        beforeValue: before ? { role, permissionKey, enabled: before.enabled } : null,
        afterValue: { role, permissionKey, enabled },
      },
    });

    return updated;
  });

  const permissions = await getRolePermissions(prisma);
  response.json({ permission, permissions });
}));
