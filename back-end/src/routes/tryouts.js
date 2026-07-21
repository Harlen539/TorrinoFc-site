import { Router } from 'express';
import { parseDateInput, parseTimeInput } from '../lib/dateInput.js';
import { sendValidationErrors } from '../lib/httpValidation.js';
import { prisma } from '../lib/prisma.js';
import { sanitizeNullableText, sanitizeStatus, sanitizeText } from '../lib/sanitizeInput.js';
import { serializeTryout } from '../lib/serializers.js';
import { requirePermission } from '../middleware/requireAdminApiKey.js';
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

function validateTryoutPayload(body) {
  const errors = [];

  if (!sanitizeText(body.title || body.fullName, { maxLength: 120 })) errors.push('EA ID / gamertag e obrigatorio.');
  if (!parseDateInput(body.tryout_date || body.date)) errors.push('Data da peneira precisa estar no formato YYYY-MM-DD.');
  if (body.tryout_time || body.time) {
    if (!parseTimeInput(body.tryout_time || body.time)) errors.push('Horario da peneira precisa estar no formato HH:mm.');
  }

  return errors;
}

function makeTryoutData(body) {
  return {
    teamName: 'Torinno FC',
    title: sanitizeText(body.title || body.fullName, { maxLength: 120 }),
    overall: numberOrNull(body.overall || body.age),
    tryoutDate: parseDateInput(body.tryout_date || body.date),
    tryoutTime: parseTimeInput(body.tryout_time || body.time),
    location: sanitizeNullableText(body.location || body.place, { maxLength: 140 }),
    category: sanitizeText(body.category || body.position, { maxLength: 60, fallback: 'Geral' }),
    contact: sanitizeNullableText(body.contact, { maxLength: 120 }),
    requirements: sanitizeNullableText(body.requirements, { maxLength: 300 }),
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

tryoutsRouter.post('/api/tryouts', requirePermission('manageTryouts'), asyncRoute(async (request, response) => {
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

  response.json({ tryout: serializeTryout(tryout) });
}));

tryoutsRouter.delete('/api/tryouts/:id', requirePermission('manageTryouts'), asyncRoute(async (request, response) => {
  await prisma.tryout.delete({ where: { id: request.params.id } });
  response.status(204).send();
}));
