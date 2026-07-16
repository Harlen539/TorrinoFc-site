import { prisma } from '../lib/prisma.js';

const preferenceByType = {
  match_created: 'matchCreated',
  match_updated: 'matchUpdated',
  match_cancelled: 'matchUpdated',
  match_24h_reminder: 'matchReminder24h',
  match_1h_reminder: 'matchReminder1h',
  championship_created: 'championships',
  member_joined: 'newMembers',
  statistics_updated: 'statistics',
  role_updated: 'administration',
};

function compact(value, fallback = '') {
  return String(value || fallback).trim();
}

function matchDateTime(match) {
  if (!match?.matchDate || !match?.matchTime) return null;

  const date = match.matchDate.toISOString().slice(0, 10);
  const time = match.matchTime.toISOString().slice(11, 19);
  return new Date(`${date}T${time}-03:00`);
}

function formatMatchDate(match) {
  const date = match.matchDate?.toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza' }) || 'data a definir';
  const time = match.matchTime?.toISOString().slice(11, 16) || 'horario a definir';
  return `${date} as ${time}`;
}

async function getRecipients({ adminsOnly = false } = {}) {
  const profiles = await prisma.userProfile.findMany({
    where: {
      email: { not: null },
      accountStatus: 'active',
      ...(adminsOnly ? { role: 'admin' } : {}),
    },
  });

  return profiles.filter((profile) => profile.email);
}

async function shouldSend(profile, type) {
  const preferenceKey = preferenceByType[type];
  if (!preferenceKey) return true;

  const preference = await prisma.notificationPreference.findUnique({
    where: { userEmail: profile.email },
  });

  return preference ? preference[preferenceKey] !== false : true;
}

export async function createNotificationsForRecipients(recipients, notification) {
  const created = [];

  for (const profile of recipients) {
    if (!(await shouldSend(profile, notification.type))) continue;

    const existing = await prisma.notification.findFirst({
      where: {
        userEmail: profile.email,
        type: notification.type,
        relatedEntityType: notification.relatedEntityType || null,
        relatedEntityId: notification.relatedEntityId || null,
        reminderType: notification.reminderType || null,
      },
    });

    if (existing) {
      const updated = await prisma.notification.update({
        where: { id: existing.id },
        data: {
          ...notification,
          userId: profile.id,
          userEmail: profile.email,
          isRead: false,
          readAt: null,
          updatedAt: new Date(),
        },
      });
      created.push(updated);
      continue;
    }

    const item = await prisma.notification.create({
      data: {
        ...notification,
        userId: profile.id,
        userEmail: profile.email,
      },
    });
    created.push(item);
  }

  return created;
}

export async function notifyMatchCreated(match) {
  const recipients = await getRecipients();
  await createNotificationsForRecipients(recipients, {
    type: 'match_created',
    title: 'Nova partida agendada',
    message: `Nova partida contra ${compact(match.awayTeam, 'adversario')} para ${formatMatchDate(match)}.`,
    relatedEntityType: 'match',
    relatedEntityId: match.id,
    actionUrl: '/calendar',
    metadata: {
      awayTeam: match.awayTeam,
      whatsappUrl: match.whatsappUrl,
      championship: match.championshipName,
    },
    sentAt: new Date(),
    status: 'sent',
  });
  await scheduleMatchReminders(match);
}

export async function notifyMatchUpdated(match, previous = {}) {
  const recipients = await getRecipients();
  const changes = [];

  if (previous.awayTeam && previous.awayTeam !== match.awayTeam) changes.push(`adversario alterado para ${match.awayTeam}`);
  if (previous.matchTime && String(previous.matchTime) !== String(match.matchTime)) changes.push(`horario alterado para ${match.matchTime?.toISOString().slice(11, 16) || 'a definir'}`);
  if (previous.matchDate && String(previous.matchDate) !== String(match.matchDate)) changes.push(`data alterada para ${formatMatchDate(match)}`);
  if (previous.championshipName && previous.championshipName !== match.championshipName) changes.push(`campeonato alterado para ${match.championshipName}`);

  await createNotificationsForRecipients(recipients, {
    type: 'match_updated',
    title: 'Partida alterada',
    message: changes.length
      ? `A partida contra ${compact(match.awayTeam, 'adversario')} teve ${changes.join(', ')}.`
      : `A partida contra ${compact(match.awayTeam, 'adversario')} foi atualizada.`,
    relatedEntityType: 'match',
    relatedEntityId: match.id,
    actionUrl: '/calendar',
    metadata: { awayTeam: match.awayTeam, whatsappUrl: match.whatsappUrl },
    sentAt: new Date(),
    status: 'sent',
  });
  await cancelMatchReminders(match.id);
  await scheduleMatchReminders(match);
}

export async function notifyMatchCancelled(match) {
  const recipients = await getRecipients();
  await cancelMatchReminders(match.id);
  await createNotificationsForRecipients(recipients, {
    type: 'match_cancelled',
    title: 'Partida cancelada',
    message: `A partida contra ${compact(match.awayTeam, 'adversario')}, marcada para ${formatMatchDate(match)}, foi cancelada.`,
    relatedEntityType: 'match',
    relatedEntityId: match.id,
    actionUrl: '/calendar',
    metadata: { awayTeam: match.awayTeam },
    sentAt: new Date(),
    status: 'sent',
  });
}

export async function notifyChampionshipCreated(championship) {
  const recipients = await getRecipients();
  await createNotificationsForRecipients(recipients, {
    type: 'championship_created',
    title: 'Campeonato adicionado',
    message: `O Torinno FC foi adicionado ao campeonato ${championship.name}.`,
    relatedEntityType: 'championship',
    relatedEntityId: championship.id,
    actionUrl: '/championships',
    metadata: { championshipName: championship.name },
    sentAt: new Date(),
    status: 'sent',
  });
}

export async function notifyMemberJoined(profile) {
  const recipients = await getRecipients();
  await createNotificationsForRecipients(recipients, {
    type: 'member_joined',
    title: 'Novo membro no elenco',
    message: `${profile.nickname || profile.name} entrou para o elenco do Torinno FC.`,
    relatedEntityType: 'user',
    relatedEntityId: profile.id,
    actionUrl: '/players',
    metadata: { memberName: profile.name, memberEmail: profile.email },
    sentAt: new Date(),
    status: 'sent',
  });
}

export async function notifyRoleUpdated(profile, nextRole) {
  await createNotificationsForRecipients([profile], {
    type: 'role_updated',
    title: nextRole === 'admin' ? 'Permissao de administrador recebida' : 'Permissao administrativa removida',
    message: nextRole === 'admin'
      ? 'Voce recebeu permissao de administrador do Torinno FC.'
      : 'Sua permissao de administrador do Torinno FC foi removida.',
    relatedEntityType: 'user',
    relatedEntityId: profile.id,
    actionUrl: '/settings',
    metadata: { role: nextRole },
    sentAt: new Date(),
    status: 'sent',
  });
}

export async function notifyStatisticsUpdated(profile, statsSummary) {
  await createNotificationsForRecipients([profile], {
    type: 'statistics_updated',
    title: 'Estatisticas atualizadas',
    message: `Suas estatisticas foram atualizadas: ${statsSummary}.`,
    relatedEntityType: 'user',
    relatedEntityId: profile.id,
    actionUrl: '/performance',
    metadata: { statsSummary },
    sentAt: new Date(),
    status: 'sent',
  });
}

export async function scheduleMatchReminders(match) {
  if (match.status === 'Cancelada' || match.status === 'Encerrada') return;

  const start = matchDateTime(match);
  if (!start || start <= new Date()) return;

  const recipients = await getRecipients();
  const reminders = [
    {
      type: 'match_24h_reminder',
      reminderType: '24h',
      scheduledFor: new Date(start.getTime() - 24 * 60 * 60 * 1000),
      title: 'Amanha tem jogo',
      message: `Amanha tem jogo! O Torinno FC enfrenta ${compact(match.awayTeam, 'adversario')} as ${match.matchTime?.toISOString().slice(11, 16) || 'horario a definir'}.`,
    },
    {
      type: 'match_1h_reminder',
      reminderType: '1h',
      scheduledFor: new Date(start.getTime() - 60 * 60 * 1000),
      title: 'Falta 1 hora para a partida',
      message: `Falta 1 hora! A partida contra ${compact(match.awayTeam, 'adversario')} comeca as ${match.matchTime?.toISOString().slice(11, 16) || 'horario a definir'}.`,
    },
  ].filter((reminder) => reminder.scheduledFor > new Date());

  for (const reminder of reminders) {
    await createNotificationsForRecipients(recipients, {
      ...reminder,
      relatedEntityType: 'match',
      relatedEntityId: match.id,
      actionUrl: '/calendar',
      metadata: { awayTeam: match.awayTeam, whatsappUrl: match.whatsappUrl },
      matchId: match.id,
      sentAt: null,
      status: 'scheduled',
    });
  }
}

export async function cancelMatchReminders(matchId) {
  await prisma.notification.updateMany({
    where: {
      matchId,
      status: 'scheduled',
    },
    data: {
      status: 'cancelled',
      updatedAt: new Date(),
    },
  });
}

export async function dispatchDueReminders() {
  const due = await prisma.notification.findMany({
    where: {
      status: 'scheduled',
      scheduledFor: { lte: new Date() },
    },
    take: 100,
  });

  for (const notification of due) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  return due.length;
}
