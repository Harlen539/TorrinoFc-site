import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';
import { requireAdminApiKey } from '../middleware/requireAdminApiKey.js';
import { sendTryoutNotification } from '../services/whatsappNotificationService.js';

export const adminTryoutsRouter = Router();

function validateTryoutPayload(body) {
  const errors = [];

  if (!body.title) errors.push('title e obrigatorio.');
  if (!body.tryout_date) errors.push('tryout_date e obrigatorio.');

  return errors;
}

adminTryoutsRouter.post('/api/admin/tryouts', requireAdminApiKey, async (request, response) => {
  const errors = validateTryoutPayload(request.body);

  if (errors.length > 0) {
    response.status(400).json({ errors });
    return;
  }

  const payload = {
    title: request.body.title,
    tryout_date: request.body.tryout_date,
    tryout_time: request.body.tryout_time || null,
    location: request.body.location || null,
    category: request.body.category || 'Geral',
    requirements: request.body.requirements || null,
    observations: request.body.observations || null,
    status: request.body.status || 'Agendada',
  };

  const { data: tryout, error } = await supabaseAdmin
    .from('tryouts')
    .insert(payload)
    .select()
    .single();

  if (error) {
    response.status(500).json({ error: error.message });
    return;
  }

  const notification = await sendTryoutNotification(tryout.id).catch((notificationError) => {
    console.error('[adminTryouts] Erro inesperado na notificacao:', notificationError);
    return { ok: false, error: notificationError.message };
  });

  response.status(201).json({ tryout, notification });
});
