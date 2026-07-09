import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireAdminApiKey } from '../middleware/requireAdminApiKey.js';
import { sendMatchNotification } from '../services/whatsappNotificationService.js';

export const adminMatchesRouter = Router();

function validateMatchPayload(body) {
  const errors = [];

  if (!body.home_team) errors.push('home_team e obrigatorio.');
  if (!body.away_team) errors.push('away_team e obrigatorio.');
  if (!body.match_date) errors.push('match_date e obrigatorio.');

  return errors;
}

adminMatchesRouter.post('/api/admin/matches', requireAdminApiKey, async (request, response) => {
  const errors = validateMatchPayload(request.body);

  if (errors.length > 0) {
    response.status(400).json({ errors });
    return;
  }

  const payload = {
    home_team: request.body.home_team,
    away_team: request.body.away_team,
    match_date: request.body.match_date,
    match_time: request.body.match_time || null,
    location: request.body.location || null,
    status: request.body.status || 'Agendada',
    observations: request.body.observations || null,
  };

  const { data: match, error } = await supabaseAdmin
    .from('matches')
    .insert(payload)
    .select()
    .single();

  if (error) {
    response.status(500).json({ error: error.message });
    return;
  }

  const notification = await sendMatchNotification(match.id).catch((notificationError) => {
    console.error('[adminMatches] Erro inesperado na notificacao:', notificationError);
    return { ok: false, error: notificationError.message };
  });

  response.status(201).json({ match, notification });
});
