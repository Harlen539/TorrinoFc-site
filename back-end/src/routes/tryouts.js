import { Router } from 'express';
import { parseDateInput, parseTimeInput } from '../lib/dateInput.js';
import { sendValidationErrors } from '../lib/httpValidation.js';
import { prisma } from '../lib/prisma.js';
import { sanitizeNullableText, sanitizeStatus, sanitizeText } from '../lib/sanitizeInput.js';
import { serializeTryout } from '../lib/serializers.js';
import { requireAuthenticatedUser, requirePermission } from '../middleware/requireAdminApiKey.js';
import { recordActivity } from '../services/activityService.js';
import { notifyTryoutCreated } from '../services/notificationService.js';
import { sendTryoutNotification } from '../services/whatsappNotificationService.js';

export const tryoutsRouter = Router();

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

function numberOrNull(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return Math.min(Math.round(number), 999);
}

function normalizeTryoutPlayers(body) {
  const entries = Array.isArray(body.players) ? body.players : Array.isArray(body.candidates) ? body.candidates : [];
  return entries
    .map((player) => ({
      name: sanitizeText(player.name || player.fullName, { maxLength: 80 }),
      position: sanitizeText(player.position, { maxLength: 60, fallback: 'Atacante' }),
    }))
    .filter((player) => player.name);
}

function validateTryoutPayload(body) {
  const errors = [];
  const players = normalizeTryoutPlayers(body);

  if (!sanitizeText(body.title || body.fullName, { maxLength: 120 }) && players.length === 0) errors.push('Informe pelo menos um jogador para a peneira.');
  if (!parseDateInput(body.tryout_date || body.date)) errors.push('Data da peneira precisa estar no formato YYYY-MM-DD.');
  if (!parseTimeInput(body.tryout_time || body.time)) errors.push('Horario da peneira precisa estar no formato HH:mm.');

  return errors;
}

function makeTryoutData(body) {
  const players = normalizeTryoutPlayers(body);
  const title = sanitizeText(
    body.title || body.fullName || (players.length === 1 ? players[0].name : `${players.length} jogadores`),
    { maxLength: 120 },
  );
  const positions = players.length ? [...new Set(players.map((player) => player.position))].join(', ') : '';
  const requirementsText = sanitizeNullableText(body.requirements, { maxLength: 700 });
  const requirements = players.length
    ? JSON.stringify({ players, requirements: requirementsText || '' })
    : requirementsText;

  return {
    teamName: 'Torinno FC',
    title,
    overall: numberOrNull(body.overall || body.age),
    tryoutDate: parseDateInput(body.tryout_date || body.date),
    tryoutTime: parseTimeInput(body.tryout_time || body.time),
    location: sanitizeNullableText(body.location || body.place, { maxLength: 140 }),
    category: sanitizeText(body.category || body.position || positions, { maxLength: 160, fallback: 'Geral' }),
    contact: sanitizeNullableText(body.contact, { maxLength: 120 }),
    requirements,
    observations: sanitizeNullableText(body.observations || body.notes, { maxLength: 700 }),
    status: sanitizeStatus(body.status),
  };
}

tryoutsRouter.get('/api/tryouts', asyncRoute(async (_request, response) => {
  const tryouts = await prisma.tryout.findMany({
    where: {
      teamName: 'Torinno FC',
    },
    orderBy: [{ tryoutDate: 'asc' }, { tryoutTime: 'asc' }, { createdAt: 'desc' }],
  });

  response.json({ tryouts: tryouts.map(serializeTryout) });
}));

tryoutsRouter.post('/api/tryouts', requireAuthenticatedUser, asyncRoute(async (request, response) => {
  const errors = validateTryoutPayload(request.body);
  if (errors.length) {
    sendValidationErrors(response, errors);
    return;
  }

  const tryout = await prisma.tryout.create({
    data: {
      ...makeTryoutData(request.body),
      createdBy: request.userProfile?.id || null,
    },
  });

  await sendTryoutNotification(tryout.id).catch((error) => {
    console.error('[tryouts] Falha ao enviar notificacao da peneira:', error);
  });
  await notifyTryoutCreated(tryout);
  await recordActivity({
    type: 'tryout_created',
    actorId: request.userProfile?.id || null,
    actorName: request.userProfile?.nickname || request.userProfile?.name || '',
    message: `Peneira ${tryout.title} criada para ${tryout.tryoutDate.toISOString().slice(0, 10)}.`,
    relatedEntityType: 'tryout',
    relatedEntityId: tryout.id,
    actionUrl: '/tryouts',
  });

  response.status(201).json({ tryout: serializeTryout(tryout) });
}));

tryoutsRouter.put('/api/tryouts/:id', requirePermission('manageTryouts'), asyncRoute(async (request, response) => {
  const errors = validateTryoutPayload(request.body);
  if (errors.length) {
    sendValidationErrors(response, errors);
    return;
  }

  const tryout = await prisma.tryout.update({
    where: { id: request.params.id },
    data: { ...makeTryoutData(request.body), updatedAt: new Date() },
  });
  await recordActivity({
    type: 'tryout_updated',
    actorId: request.userProfile?.id || null,
    actorName: request.userProfile?.nickname || request.userProfile?.name || '',
    message: `Peneira ${tryout.title} atualizada.`,
    relatedEntityType: 'tryout',
    relatedEntityId: tryout.id,
    actionUrl: '/tryouts',
  });

  response.json({ tryout: serializeTryout(tryout) });
}));

tryoutsRouter.patch('/api/tryouts/:id/status', requirePermission('manageTryouts'), asyncRoute(async (request, response) => {
  const tryout = await prisma.tryout.update({
    where: { id: request.params.id },
    data: {
      status: sanitizeStatus(request.body.status),
      updatedAt: new Date(),
    },
  });
  await recordActivity({
    type: 'tryout_status_updated',
    actorId: request.userProfile?.id || null,
    actorName: request.userProfile?.nickname || request.userProfile?.name || '',
    message: `Peneira ${tryout.title} marcada como ${tryout.status}.`,
    relatedEntityType: 'tryout',
    relatedEntityId: tryout.id,
    actionUrl: '/tryouts',
  });

  response.json({ tryout: serializeTryout(tryout) });
}));

tryoutsRouter.delete('/api/tryouts/:id', requirePermission('manageTryouts'), asyncRoute(async (request, response) => {
  const tryout = await prisma.tryout.findUnique({ where: { id: request.params.id } });
  await prisma.tryout.delete({ where: { id: request.params.id } });
  await recordActivity({
    type: 'tryout_removed',
    actorId: request.userProfile?.id || null,
    actorName: request.userProfile?.nickname || request.userProfile?.name || '',
    message: `Peneira ${tryout?.title || 'agendada'} removida.`,
    relatedEntityType: 'tryout',
    relatedEntityId: request.params.id,
    actionUrl: '/tryouts',
  });
  response.status(204).send();
}));
