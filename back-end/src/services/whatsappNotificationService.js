import { env } from '../config/env.js';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const CHANNEL = 'whatsapp';

function isDuplicateError(error) {
  return error?.code === '23505';
}

function formatDate(value) {
  if (!value) return 'Data a definir';

  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return String(value);

  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
}

function formatTime(value) {
  if (!value) return 'Horario a definir';
  return String(value).slice(0, 5);
}

function compact(value, fallback = 'Nao informado') {
  const text = String(value || '').trim();
  return text || fallback;
}

function buildMatchMessage(match) {
  return [
    '🏆 Nova partida agendada — Torrino FC',
    '',
    `📅 Data: ${formatDate(match.match_date)}`,
    `⏰ Horario: ${formatTime(match.match_time)}`,
    `📍 Local: ${compact(match.location)}`,
    '⚽ Tipo: Partida',
    '',
    'Times:',
    `${compact(match.home_team, 'Torrino FC')} x ${compact(match.away_team, 'Adversario')}`,
    '',
    'Informacoes extras:',
    compact(match.observations || match.notes),
    '',
    'Acesse o site para mais detalhes.',
  ].join('\n');
}

function buildTryoutMessage(tryout) {
  return [
    '🔥 Nova peneira agendada — Torrino FC',
    '',
    `📅 Data: ${formatDate(tryout.tryout_date)}`,
    `⏰ Horario: ${formatTime(tryout.tryout_time)}`,
    `📍 Local: ${compact(tryout.location)}`,
    `⚽ Categoria: ${compact(tryout.category, 'Geral')}`,
    '',
    'Requisitos:',
    compact(tryout.requirements),
    '',
    'Observacoes:',
    compact(tryout.observations),
    '',
    'Interessados devem acessar o site e realizar o cadastro.',
  ].join('\n');
}

function getWhatsAppConfig() {
  const { accessToken, phoneNumberId, groupId, apiVersion, adminRecipients } = env.whatsapp;

  if (!accessToken || !phoneNumberId || !apiVersion) {
    return {
      ok: false,
      reason: 'WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_API_VERSION precisam estar configurados.',
    };
  }

  if (!groupId && adminRecipients.length === 0) {
    return {
      ok: false,
      reason: 'Configure WHATSAPP_GROUP_ID ou WHATSAPP_ADMIN_RECIPIENTS.',
    };
  }

  return { ok: true, accessToken, phoneNumberId, groupId, apiVersion, adminRecipients };
}

async function reserveNotificationLog({ eventType, entityId, destination, message }) {
  const { data, error } = await supabaseAdmin
    .from('notification_logs')
    .insert({
      event_type: eventType,
      entity_id: entityId,
      channel: CHANNEL,
      destination,
      status: 'pending',
      message_body: message,
    })
    .select()
    .single();

  if (!error) {
    return { log: data, duplicate: false };
  }

  if (!isDuplicateError(error)) {
    throw error;
  }

  const { data: existing, error: selectError } = await supabaseAdmin
    .from('notification_logs')
    .select('*')
    .eq('event_type', eventType)
    .eq('entity_id', entityId)
    .eq('channel', CHANNEL)
    .eq('destination', destination)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  return { log: existing, duplicate: true };
}

async function updateNotificationLog(logId, payload) {
  const { error } = await supabaseAdmin
    .from('notification_logs')
    .update({
      ...payload,
      sent_at: payload.status === 'sent' ? new Date().toISOString() : null,
    })
    .eq('id', logId);

  if (error) {
    console.error('[whatsappNotificationService] Falha ao atualizar notification_logs:', error);
  }
}

async function sendWhatsAppText({ to, message, recipientType = 'individual' }) {
  const config = getWhatsAppConfig();

  if (!config.ok) {
    throw new Error(config.reason);
  }

  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: recipientType,
      to,
      type: 'text',
      text: {
        preview_url: false,
        body: message,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiMessage = payload?.error?.message || response.statusText;
    const error = new Error(`WhatsApp API respondeu ${response.status}: ${apiMessage}`);
    error.response = payload;
    throw error;
  }

  return payload;
}

export async function sendWhatsAppGroupMessage(message) {
  const config = getWhatsAppConfig();

  if (!config.ok) {
    throw new Error(config.reason);
  }

  if (config.groupId) {
    return sendWhatsAppText({
      to: config.groupId,
      message,
      recipientType: 'group',
    });
  }

  const responses = [];
  for (const recipient of config.adminRecipients) {
    responses.push(await sendWhatsAppText({ to: recipient, message }));
  }

  return { fallback: 'admin_recipients', responses };
}

async function notifyOnce({ eventType, entityId, message }) {
  const config = getWhatsAppConfig();
  const destination = config.ok && config.groupId ? config.groupId : `admins:${env.whatsapp.adminRecipients.join(',')}`;
  const { log, duplicate } = await reserveNotificationLog({ eventType, entityId, destination, message });

  if (duplicate) {
    console.info(`[whatsappNotificationService] Notificacao ja registrada: ${eventType}/${entityId}`);
    return { skipped: true, log };
  }

  if (!config.ok) {
    await updateNotificationLog(log.id, {
      status: 'failed',
      error_message: config.reason,
      api_response: null,
    });
    return { ok: false, error: config.reason, log };
  }

  try {
    const apiResponse = await sendWhatsAppGroupMessage(message);
    await updateNotificationLog(log.id, {
      status: 'sent',
      api_response: apiResponse,
      error_message: null,
    });
    return { ok: true, apiResponse, log };
  } catch (error) {
    await updateNotificationLog(log.id, {
      status: 'failed',
      api_response: error.response || null,
      error_message: error.message,
    });
    console.error(`[whatsappNotificationService] Falha ao enviar ${eventType}/${entityId}:`, error.message);
    return { ok: false, error: error.message, log };
  }
}

export async function sendMatchNotification(matchId) {
  const { data: match, error } = await supabaseAdmin
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single();

  if (error) {
    throw error;
  }

  return notifyOnce({
    eventType: 'match_created',
    entityId: match.id,
    message: buildMatchMessage(match),
  });
}

export async function sendTryoutNotification(tryoutId) {
  const { data: tryout, error } = await supabaseAdmin
    .from('tryouts')
    .select('*')
    .eq('id', tryoutId)
    .single();

  if (error) {
    throw error;
  }

  return notifyOnce({
    eventType: 'tryout_created',
    entityId: tryout.id,
    message: buildTryoutMessage(tryout),
  });
}
