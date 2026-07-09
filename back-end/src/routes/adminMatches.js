import { Router } from 'express';
import { parseDateInput, parseTimeInput } from '../lib/dateInput.js';
import { prisma } from '../lib/prisma.js';
import { requireAdminApiKey } from '../middleware/requireAdminApiKey.js';
import { sendMatchNotification } from '../services/whatsappNotificationService.js';

export const adminMatchesRouter = Router();

function validateMatchPayload(body) {
  const errors = [];

  if (!body.home_team) errors.push('home_team e obrigatorio.');
  if (!body.away_team) errors.push('away_team e obrigatorio.');
  if (!parseDateInput(body.match_date)) errors.push('match_date precisa estar no formato YYYY-MM-DD.');
  if (body.match_time && !parseTimeInput(body.match_time)) errors.push('match_time precisa estar no formato HH:mm.');

  return errors;
}

adminMatchesRouter.post('/api/admin/matches', requireAdminApiKey, async (request, response) => {
  const errors = validateMatchPayload(request.body);

  if (errors.length > 0) {
    response.status(400).json({ errors });
    return;
  }

  const matchDate = parseDateInput(request.body.match_date);
  const matchTime = parseTimeInput(request.body.match_time);

  const data = {
    homeTeam: request.body.home_team,
    awayTeam: request.body.away_team,
    matchDate,
    matchTime,
    location: request.body.location || null,
    status: request.body.status || 'Agendada',
    observations: request.body.observations || null,
  };

  let match;
  try {
    match = await prisma.match.create({ data });
  } catch (error) {
    response.status(500).json({ error: error.message });
    return;
  }

  const notification = await sendMatchNotification(match.id).catch((notificationError) => {
    console.error('[adminMatches] Erro inesperado na notificacao:', notificationError);
    return { ok: false, error: notificationError.message };
  });

  response.status(201).json({ match, notification });
});
