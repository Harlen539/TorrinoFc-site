import { Router } from 'express';
import { parseDateInput, parseTimeInput } from '../lib/dateInput.js';
import { prisma } from '../lib/prisma.js';
import { sanitizeNullableText, sanitizeStatus, sanitizeText } from '../lib/sanitizeInput.js';
import { requireAdminApiKey } from '../middleware/requireAdminApiKey.js';
import { sendTryoutNotification } from '../services/whatsappNotificationService.js';

export const adminTryoutsRouter = Router();

function validateTryoutPayload(body) {
  const errors = [];

  if (!sanitizeText(body.title, { maxLength: 100 })) errors.push('title e obrigatorio.');
  if (!parseDateInput(body.tryout_date)) errors.push('tryout_date precisa estar no formato YYYY-MM-DD.');
  if (body.tryout_time && !parseTimeInput(body.tryout_time)) errors.push('tryout_time precisa estar no formato HH:mm.');

  return errors;
}

adminTryoutsRouter.post('/api/admin/tryouts', requireAdminApiKey, async (request, response) => {
  const errors = validateTryoutPayload(request.body);

  if (errors.length > 0) {
    response.status(400).json({ errors });
    return;
  }

  const tryoutDate = parseDateInput(request.body.tryout_date);
  const tryoutTime = parseTimeInput(request.body.tryout_time);

  const data = {
    title: sanitizeText(request.body.title, { maxLength: 100 }),
    tryoutDate,
    tryoutTime,
    location: sanitizeNullableText(request.body.location, { maxLength: 140 }),
    category: sanitizeText(request.body.category, { maxLength: 60, fallback: 'Geral' }),
    requirements: sanitizeNullableText(request.body.requirements, { maxLength: 300 }),
    observations: sanitizeNullableText(request.body.observations, { maxLength: 500 }),
    status: sanitizeStatus(request.body.status),
  };

  let tryout;
  try {
    tryout = await prisma.tryout.create({ data });
  } catch (error) {
    console.error('[adminTryouts] Falha ao criar peneira:', error);
    response.status(500).json({ error: 'Nao foi possivel criar a peneira.' });
    return;
  }

  const notification = await sendTryoutNotification(tryout.id).catch((notificationError) => {
    console.error('[adminTryouts] Erro inesperado na notificacao:', notificationError);
    return { ok: false, error: notificationError.message };
  });

  response.status(201).json({ tryout, notification });
});
