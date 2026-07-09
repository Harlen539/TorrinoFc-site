import { Router } from 'express';
import { parseDateInput, parseTimeInput } from '../lib/dateInput.js';
import { prisma } from '../lib/prisma.js';
import { requireAdminApiKey } from '../middleware/requireAdminApiKey.js';
import { sendTryoutNotification } from '../services/whatsappNotificationService.js';

export const adminTryoutsRouter = Router();

function validateTryoutPayload(body) {
  const errors = [];

  if (!body.title) errors.push('title e obrigatorio.');
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
    title: request.body.title,
    tryoutDate,
    tryoutTime,
    location: request.body.location || null,
    category: request.body.category || 'Geral',
    requirements: request.body.requirements || null,
    observations: request.body.observations || null,
    status: request.body.status || 'Agendada',
  };

  let tryout;
  try {
    tryout = await prisma.tryout.create({ data });
  } catch (error) {
    response.status(500).json({ error: error.message });
    return;
  }

  const notification = await sendTryoutNotification(tryout.id).catch((notificationError) => {
    console.error('[adminTryouts] Erro inesperado na notificacao:', notificationError);
    return { ok: false, error: notificationError.message };
  });

  response.status(201).json({ tryout, notification });
});
