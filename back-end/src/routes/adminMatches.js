import { Router } from 'express';
import { parseDateInput, parseTimeInput } from '../lib/dateInput.js';
import { prisma } from '../lib/prisma.js';
import { sanitizeNullableText, sanitizeStatus, sanitizeText } from '../lib/sanitizeInput.js';
import { requirePermission } from '../middleware/requireAdminApiKey.js';
import { sendMatchNotification } from '../services/whatsappNotificationService.js';

export const adminMatchesRouter = Router();

function validateMatchPayload(body) {
  const errors = [];

  if (!sanitizeText(body.home_team, { maxLength: 80 })) errors.push('home_team e obrigatorio.');
  if (!sanitizeText(body.away_team, { maxLength: 80 })) errors.push('away_team e obrigatorio.');
  if (!parseDateInput(body.match_date)) errors.push('match_date precisa estar no formato YYYY-MM-DD.');
  if (body.match_time && !parseTimeInput(body.match_time)) errors.push('match_time precisa estar no formato HH:mm.');

  return errors;
}

adminMatchesRouter.post('/api/admin/matches', requirePermission('createMatch'), async (request, response) => {
  const errors = validateMatchPayload(request.body);

  if (errors.length > 0) {
    response.status(400).json({ errors });
    return;
  }

  const matchDate = parseDateInput(request.body.match_date);
  const matchTime = parseTimeInput(request.body.match_time);

  const data = {
    homeTeam: sanitizeText(request.body.home_team, { maxLength: 80 }),
    awayTeam: sanitizeText(request.body.away_team, { maxLength: 80 }),
    matchDate,
    matchTime,
    location: sanitizeNullableText(request.body.location, { maxLength: 140 }),
    status: sanitizeStatus(request.body.status),
    observations: sanitizeNullableText(request.body.observations, { maxLength: 500 }),
  };

  let match;
  try {
    match = await prisma.match.create({ data });
  } catch (error) {
    console.error('[adminMatches] Falha ao criar partida:', error);
    response.status(500).json({ error: 'Nao foi possivel criar a partida.' });
    return;
  }

  const notification = await sendMatchNotification(match.id).catch((notificationError) => {
    console.error('[adminMatches] Erro inesperado na notificacao:', notificationError);
    return { ok: false, error: notificationError.message };
  });

  response.status(201).json({ match, notification });
});
