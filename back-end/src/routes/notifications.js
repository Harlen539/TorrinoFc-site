import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { sanitizeText } from '../lib/sanitizeInput.js';

export const notificationsRouter = Router();

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

function userEmailFromRequest(request) {
  return String(request.get('x-user-email') || request.query.email || '').trim().toLowerCase();
}

function serializeNotification(item) {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    message: item.message,
    relatedEntityType: item.relatedEntityType || '',
    relatedEntityId: item.relatedEntityId || '',
    actionUrl: item.actionUrl || '',
    isRead: item.isRead,
    readAt: item.readAt,
    metadata: item.metadata || {},
    scheduledFor: item.scheduledFor,
    sentAt: item.sentAt,
    status: item.status,
    reminderType: item.reminderType || '',
    createdAt: item.createdAt,
  };
}

notificationsRouter.get('/api/notifications', asyncRoute(async (request, response) => {
  const email = userEmailFromRequest(request);
  if (!email) {
    response.status(400).json({ error: 'E-mail do usuario e obrigatorio.' });
    return;
  }

  const take = Math.min(Number(request.query.limit || 40), 80);
  const unreadOnly = request.query.unread === 'true';
  const type = sanitizeText(request.query.type, { maxLength: 60 });
  const notifications = await prisma.notification.findMany({
    where: {
      userEmail: email,
      status: 'sent',
      ...(unreadOnly ? { isRead: false } : {}),
      ...(type ? { type } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take,
  });
  const unreadCount = await prisma.notification.count({
    where: { userEmail: email, status: 'sent', isRead: false },
  });

  response.json({ notifications: notifications.map(serializeNotification), unreadCount });
}));

notificationsRouter.patch('/api/notifications/:id/read', asyncRoute(async (request, response) => {
  const email = userEmailFromRequest(request);
  const isRead = request.body.is_read !== false;
  const notification = await prisma.notification.updateMany({
    where: { id: request.params.id, userEmail: email },
    data: {
      isRead,
      readAt: isRead ? new Date() : null,
      updatedAt: new Date(),
    },
  });

  response.json({ ok: notification.count > 0 });
}));

notificationsRouter.patch('/api/notifications/read-all', asyncRoute(async (request, response) => {
  const email = userEmailFromRequest(request);
  const result = await prisma.notification.updateMany({
    where: { userEmail: email, status: 'sent', isRead: false },
    data: { isRead: true, readAt: new Date(), updatedAt: new Date() },
  });

  response.json({ ok: true, count: result.count });
}));

notificationsRouter.delete('/api/notifications/:id', asyncRoute(async (request, response) => {
  const email = userEmailFromRequest(request);
  await prisma.notification.deleteMany({ where: { id: request.params.id, userEmail: email } });
  response.status(204).send();
}));

notificationsRouter.get('/api/notification-preferences', asyncRoute(async (request, response) => {
  const email = userEmailFromRequest(request);
  if (!email) {
    response.status(400).json({ error: 'E-mail do usuario e obrigatorio.' });
    return;
  }

  const preferences = await prisma.notificationPreference.upsert({
    where: { userEmail: email },
    update: {},
    create: { userEmail: email },
  });

  response.json({ preferences });
}));

notificationsRouter.put('/api/notification-preferences', asyncRoute(async (request, response) => {
  const email = userEmailFromRequest(request);
  const data = {
    matchCreated: request.body.matchCreated !== false,
    matchUpdated: request.body.matchUpdated !== false,
    matchReminder24h: request.body.matchReminder24h !== false,
    matchReminder1h: request.body.matchReminder1h !== false,
    championships: request.body.championships !== false,
    newMembers: request.body.newMembers !== false,
    statistics: request.body.statistics !== false,
    administration: request.body.administration !== false,
    updatedAt: new Date(),
  };

  const preferences = await prisma.notificationPreference.upsert({
    where: { userEmail: email },
    update: data,
    create: { ...data, userEmail: email },
  });

  response.json({ preferences });
}));
