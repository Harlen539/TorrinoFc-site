import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

const CHANNEL = 'whatsapp';

function isDuplicateError(error) {
  return error?.code === 'P2002';
}

function formatDate(value) {
  if (!value) return 'Data a definir';

  if (value instanceof Date) {
    return value.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return String(value);

  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
}

function formatTime(value) {
  if (!value) return 'Horario a definir';

  if (value instanceof Date) {
    return value.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC',
    });
  }

  return String(value).slice(0, 5);
}

function compact(value, fallback = 'Nao informado') {
  const text = String(value || '').trim();
  return text || fallback;
}

function buildMatchMessage(match) {
  return [
    '🏆 Nova partida agendada - Torrino FC',
    '',
    `📅 Data: ${formatDate(match.matchDate)}`,
    `⏰ Horario: ${formatTime(match.matchTime)}`,
    `📍 Local: ${compact(match.location)}`,
    '⚽ Tipo: Partida',
    '',
    'Times:',
    `${compact(match.homeTeam, 'Torrino FC')} x ${compact(match.awayTeam, 'Adversario')}`,
    '',
    'Informacoes extras:',
    compact(match.observations),
    '',
    'Acesse o site para mais detalhes.',
  ].join('\n');
}

function buildTryoutMessage(tryout) {
  return [
    '🔥 Nova peneira agendada - Torrino FC',
    '',
    `📅 Data: ${formatDate(tryout.tryoutDate)}`,
    `⏰ Horario: ${formatTime(tryout.tryoutTime)}`,
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
  const { notificationMode, accessToken, phoneNumberId, groupId, apiVersion, adminRecipients } = env.whatsapp;

  if (notificationMode === 'manual') {
    return {
      ok: false,
      mode: 'manual',
      reason: 'WHATSAPP_NOTIFICATION_MODE=manual: envio automatico desativado. Use o fallback manual do app.',
    };
  }

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

  return { ok: true, mode: 'cloud_api', accessToken, phoneNumberId, groupId, apiVersion, adminRecipients };
}

async function reserveNotificationLog({ eventType, entityId, destination, message }) {
  try {
    const log = await prisma.notificationLog.create({
      data: {
        eventType,
        entityId,
        channel: CHANNEL,
        destination,
        status: 'pending',
        messageBody: message,
      },
    });

    return { log, duplicate: false };
  } catch (error) {
    if (!isDuplicateError(error)) {
      throw error;
    }

    const existing = await prisma.notificationLog.findFirst({
      where: {
        eventType,
        entityId,
        channel: CHANNEL,
        destination,
      },
    });

    return { log: existing, duplicate: true };
  }
}

async function updateNotificationLog(logId, payload) {
  try {
    await prisma.notificationLog.update({
      where: { id: logId },
      data: {
        status: payload.status,
        apiResponse: payload.apiResponse || null,
        errorMessage: payload.errorMessage || null,
        sentAt: payload.status === 'sent' ? new Date() : null,
      },
    });
  } catch (error) {
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
  const destination = config.mode === 'manual'
    ? 'manual:whatsapp-group'
    : config.ok && config.groupId
      ? config.groupId
      : `admins:${env.whatsapp.adminRecipients.join(',')}`;
  const { log, duplicate } = await reserveNotificationLog({ eventType, entityId, destination, message });

  if (duplicate) {
    console.info(`[whatsappNotificationService] Notificacao ja registrada: ${eventType}/${entityId}`);
    return { skipped: true, log };
  }

  if (!config.ok) {
    await updateNotificationLog(log.id, {
      status: config.mode === 'manual' ? 'manual_required' : 'failed',
      errorMessage: config.reason,
      apiResponse: null,
    });
    return { ok: false, error: config.reason, log };
  }

  try {
    const apiResponse = await sendWhatsAppGroupMessage(message);
    await updateNotificationLog(log.id, {
      status: 'sent',
      apiResponse,
      errorMessage: null,
    });
    return { ok: true, apiResponse, log };
  } catch (error) {
    await updateNotificationLog(log.id, {
      status: 'failed',
      apiResponse: error.response || null,
      errorMessage: error.message,
    });
    console.error(`[whatsappNotificationService] Falha ao enviar ${eventType}/${entityId}:`, error.message);
    return { ok: false, error: error.message, log };
  }
}

export async function sendMatchNotification(matchId) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });

  if (!match) {
    throw new Error(`Partida nao encontrada: ${matchId}`);
  }

  return notifyOnce({
    eventType: 'match_created',
    entityId: match.id,
    message: buildMatchMessage(match),
  });
}

export async function sendTryoutNotification(tryoutId) {
  const tryout = await prisma.tryout.findUnique({ where: { id: tryoutId } });

  if (!tryout) {
    throw new Error(`Peneira nao encontrada: ${tryoutId}`);
  }

  return notifyOnce({
    eventType: 'tryout_created',
    entityId: tryout.id,
    message: buildTryoutMessage(tryout),
  });
}
