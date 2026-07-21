import { Router } from 'express';
import { parseDateInput } from '../lib/dateInput.js';
import { isValidUrl, sendValidationErrors } from '../lib/httpValidation.js';
import { prisma } from '../lib/prisma.js';
import { sanitizeNullableText, sanitizeText } from '../lib/sanitizeInput.js';
import { serializeChampionship } from '../lib/serializers.js';
import { requirePermission } from '../middleware/requireAdminApiKey.js';
import { notifyChampionshipCreated } from '../services/notificationService.js';

export const championshipsRouter = Router();

const allowedStatus = new Set(['futuro', 'em_andamento', 'encerrado']);
const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

function validateChampionshipPayload(body) {
  const errors = [];

  if (!sanitizeText(body.name, { maxLength: 120 })) errors.push('Nome do campeonato e obrigatorio.');
  if (body.start_date && !parseDateInput(body.start_date)) errors.push('Data de inicio invalida.');
  if (body.end_date && !parseDateInput(body.end_date)) errors.push('Data de termino invalida.');
  if (!isValidUrl(body.image_url || body.imageUrl)) errors.push('URL da imagem invalida.');
  if (!isValidUrl(body.official_url || body.officialUrl)) errors.push('Link oficial invalido.');

  return errors;
}

function makeChampionshipData(body) {
  const status = sanitizeText(body.status, { maxLength: 32, fallback: 'futuro' });

  return {
    teamName: 'Torinno FC',
    name: sanitizeText(body.name, { maxLength: 120 }),
    imageUrl: sanitizeNullableText(body.image_url || body.imageUrl, { maxLength: 1200 }),
    season: sanitizeNullableText(body.season, { maxLength: 40 }),
    startDate: parseDateInput(body.start_date || body.startDate),
    endDate: parseDateInput(body.end_date || body.endDate),
    format: sanitizeNullableText(body.format, { maxLength: 80 }),
    status: allowedStatus.has(status) ? status : 'futuro',
    officialUrl: sanitizeNullableText(body.official_url || body.officialUrl, { maxLength: 1200 }),
    description: sanitizeNullableText(body.description, { maxLength: 700 }),
  };
}

championshipsRouter.get('/api/championships', asyncRoute(async (_request, response) => {
  const championships = await prisma.championship.findMany({
    orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
  });

  response.json({ championships: championships.map(serializeChampionship) });
}));

championshipsRouter.post('/api/championships', requirePermission('manageChampionships'), asyncRoute(async (request, response) => {
  const errors = validateChampionshipPayload(request.body);
  if (errors.length) {
    sendValidationErrors(response, errors);
    return;
  }

  const championship = await prisma.championship.create({
    data: {
      ...makeChampionshipData(request.body),
      createdBy: request.userProfile?.id || null,
    },
  });
  await notifyChampionshipCreated(championship);
  response.status(201).json({ championship: serializeChampionship(championship) });
}));

championshipsRouter.put('/api/championships/:id', requirePermission('manageChampionships'), asyncRoute(async (request, response) => {
  const errors = validateChampionshipPayload(request.body);
  if (errors.length) {
    sendValidationErrors(response, errors);
    return;
  }

  const championship = await prisma.championship.update({
    where: { id: request.params.id },
    data: { ...makeChampionshipData(request.body), updatedAt: new Date() },
  });
  response.json({ championship: serializeChampionship(championship) });
}));

championshipsRouter.delete('/api/championships/:id', requirePermission('manageChampionships'), asyncRoute(async (request, response) => {
  await prisma.championship.delete({ where: { id: request.params.id } });
  response.status(204).send();
}));
