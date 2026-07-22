import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Edit3,
  Eye,
  EyeOff,
  Flag,
  Home,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  UploadCloud,
  User,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { hasSupabaseConfig, supabase } from './lib/supabaseClient.js';
import {
  getAuthSession,
  resendSignupConfirmation,
  signInWithPassword,
  signOut as signOutSupabase,
  subscribeToAuthChanges,
} from './features/auth/authService.js';
import { prepareOpponentLogo } from './features/matches/image.js';
import {
  createChampionship as apiCreateChampionship,
  createMatch as apiCreateMatch,
  createPlayer as apiCreatePlayer,
  deleteChampionship as apiDeleteChampionship,
  deleteMatch as apiDeleteMatch,
  deleteNotification as apiDeleteNotification,
  deletePlayer as apiDeletePlayer,
  deleteTryout as apiDeleteTryout,
  deleteMyPerformance as apiDeleteMyPerformance,
  downloadPerformanceReport,
  fetchActivities,
  fetchAchievements,
  fetchChampionships,
  fetchClubSettings,
  fetchCurrentUser,
  fetchMatches,
  fetchMatchday,
  fetchMatchAttendance,
  fetchMatchLineup,
  fetchMyPerformance,
  fetchMySettings,
  fetchNotificationPreferences,
  fetchNotifications,
  fetchPlayerPerformance,
  markAllNotificationsRead as apiMarkAllNotificationsRead,
  markNotificationRead as apiMarkNotificationRead,
  fetchPlayers,
  fetchRolePermissions,
  fetchTryouts,
  fetchUsers,
  registerAccount as apiRegisterAccount,
  createPlayerPerformance as apiCreatePlayerPerformance,
  createMyPerformance as apiCreateMyPerformance,
  syncUser as apiSyncUser,
  updateChampionship as apiUpdateChampionship,
  updateClubSettings,
  updateMatchLineup,
  updateMatch as apiUpdateMatch,
  updateMyAttendance,
  updateMyPerformance as apiUpdateMyPerformance,
  updateMySettings,
  updateNotificationPreferences,
  updateRolePermission,
  updatePlayerStats as apiUpdatePlayerStats,
  createTryout as apiCreateTryout,
  promoteCurrentUser as apiPromoteCurrentUser,
  updateTryoutStatus as apiUpdateTryoutStatus,
  updateUserRole as apiUpdateUserRole,
  updateUserStatus as apiUpdateUserStatus,
} from './lib/api.js';

const logo = '/assets/logo-torrino.png';
const banner = '/assets/banner-torrino.png';
const WHATSAPP_GROUP_INVITE_URL = 'https://chat.whatsapp.com/H9xNmzvwgAbAJXd65BNrIf?mode=gi_t';

const initialPlayers = [];

const initialUsers = [];

const initialMatches = [];

const initialTryouts = [];

const localUsersKey = 'torinnofc-users-cache';
const localPlayersKey = 'torinnofc-players-cache';
const localMatchesKey = 'torinnofc-matches-cache';
const localTryoutsKey = 'torinnofc-tryouts-cache';
const localChampionshipsKey = 'torinnofc-championships-cache';
const localMatchPerformancesKey = 'torinnofc-match-performance-cache';
const localNotificationPreferencesKey = 'torinnofc-notification-preferences-cache';

const defaultNotificationPreferences = {
  matchCreated: true,
  matchUpdated: true,
  tryoutCreated: true,
  matchReminder24h: true,
  matchReminder1h: true,
  championships: true,
  newMembers: true,
  statistics: true,
  administration: true,
};

const navItems = [
  { id: 'dashboard', label: 'Painel', icon: Home },
  { id: 'profile', label: 'Meu Perfil', icon: User },
  { id: 'performance', label: 'Meu Desempenho', icon: Activity },
  { id: 'players', label: 'Jogadores', icon: Users },
  { id: 'tryouts', label: 'Peneiras', icon: UserPlus },
  { id: 'matches', label: 'Partidas', icon: Flag },
  { id: 'matchday', label: 'Matchday', icon: Clock },
  { id: 'calendar', label: 'Calendario', icon: CalendarDays },
  { id: 'notifications', label: 'Notificacoes', icon: Bell },
  { id: 'ranking', label: 'Ranking', icon: Trophy },
  { id: 'compare', label: 'Comparar', icon: BarChart3 },
  { id: 'team', label: 'Time', icon: Shield },
  { id: 'championships', label: 'Campeonatos', icon: Crown },
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
  { id: 'settings', label: 'Configuracoes', icon: Settings },
  { id: 'logout', label: 'Sair', icon: LogOut },
];

const positions = [
  'Goleiro',
  'Zagueiro',
  'Lateral direito',
  'Lateral esquerdo',
  'Volante',
  'Meio-campo',
  'Meia-atacante',
  'Ponta direita',
  'Ponta esquerda',
  'Atacante',
];

const gamePositions = [
  'Goleiro',
  'Zagueiro',
  'Lateral',
  'Volante',
  'Meia',
  'Ponta',
  'Atacante',
  'Centroavante',
];

const statusFlow = ['Agendada', 'Em andamento', 'Encerrada'];
function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function buildOpponentLogoDataUrl(name = 'Adversario') {
  const initials = getInitials(name || 'AD');
  const safeInitials = initials.replace(/[^A-Z0-9]/g, '').slice(0, 2) || 'AD';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="24" fill="#0b0f16"/>
      <circle cx="48" cy="48" r="34" fill="#4a0712" stroke="#d4a24c" stroke-width="3"/>
      <text x="48" y="56" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" font-weight="900" fill="#f6c768">${safeInitials}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function normalizeMatchEvent(match) {
  return {
    ...match,
    home: match.home || 'TorinnoFC',
    homeLogo: match.homeLogo || logo,
    away: match.away || 'Adversario',
    opponentLogo: match.opponentLogo || buildOpponentLogoDataUrl(match.away),
    date: match.date || formatDateLabel(match.dateKey),
    time: match.time || 'A definir',
    place: match.place || 'A definir',
    championship: match.championship || 'Agenda',
    status: match.status || 'Agendada',
    score: match.score || '-',
    dateKey: match.dateKey,
    type: 'Partida',
  };
}

function buildCalendarEvents(matches, tryouts = []) {
  return [
    ...matches.map((match) => {
      const normalized = normalizeMatchEvent(match);
      return {
        ...normalized,
        calendarId: `match-${normalized.id}`,
        source: 'match',
        title: `${normalized.home} x ${normalized.away}`,
        subtitle: `${normalized.time} | ${normalized.place} | ${normalized.status}`,
        description: normalized.observations || `${normalized.championship || 'Partida'} contra ${normalized.away}.`,
        logo: normalized.opponentLogo,
      };
    }),
    ...tryouts.map((tryout) => {
      const normalized = normalizeTryout(tryout);
      return {
        ...normalized,
        calendarId: `tryout-${normalized.id}`,
        source: 'tryout',
        type: 'Peneira',
        dateKey: normalized.date,
        time: normalized.time || 'A definir',
        title: `Peneira: ${normalized.fullName || 'Novo jogador'}`,
        subtitle: `${normalized.time || 'A definir'} | ${normalized.place || 'EA FC 26 | Clubs'} | ${normalized.status || 'Agendada'}`,
        description: normalized.notes || normalized.requirements || summarizeTryoutPlayers(normalized.players),
        logo,
        status: normalized.status || 'Agendada',
      };
    }),
  ];
}

function openWhatsAppWithPreparedMessage(whatsappUrl, message, notify) {
  const targetUrl = buildWhatsAppUrlWithMessage(whatsappUrl || WHATSAPP_GROUP_INVITE_URL, message);
  const tab = window.open(targetUrl, '_blank', 'noopener,noreferrer');

  copyTextToClipboard(message)
    .then(() => notify('Mensagem pronta copiada. Cole no WhatsApp aberto.'))
    .catch(() => notify('WhatsApp aberto. Copie a mensagem do agendamento manualmente.'));

  if (!tab) {
    window.location.href = targetUrl;
  }
}

function buildWhatsAppUrlWithMessage(url, message) {
  if (!url) {
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'wa.me') {
      parsed.searchParams.set('text', message);
      return parsed.toString();
    }
    if (host === 'api.whatsapp.com' || host === 'web.whatsapp.com') {
      parsed.searchParams.set('text', message);
      return parsed.toString();
    }
    return parsed.toString();
  } catch {
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }
}

function buildMatchWhatsAppMessage(match) {
  return [
    'Nova partida agendada - Torrino FC',
    '',
    `Data: ${match.date || formatDateLabel(match.dateKey)}`,
    `Horario: ${match.time || 'A definir'}`,
    `Local: ${match.place || 'A definir'}`,
    'Tipo: Partida',
    '',
    'Times:',
    `${match.home || 'TorinnoFC'} x ${match.away || 'Adversario'}`,
    '',
    'Informacoes extras:',
    match.championship || 'Sem observacoes.',
    '',
    'Acesse o site para mais detalhes.',
  ].join('\n');
}

function buildTryoutWhatsAppMessage(tryout) {
  const players = normalizeTryoutPlayers(tryout.players);

  return [
    'Nova peneira agendada - Torrino FC',
    '',
    `Data: ${formatDateLabel(tryout.date)}`,
    `Horario: ${tryout.time || 'A definir'}`,
    `Local: ${tryout.place || 'A definir'}`,
    `Posicoes: ${tryout.position || 'Geral'}`,
    '',
    'Jogadores:',
    players.length
      ? players.map((player) => `- ${player.name} | ${player.position}`).join('\n')
      : `- ${tryout.fullName || 'A definir'} | ${tryout.position || 'Geral'}`,
    '',
    'Requisitos:',
    [tryout.age ? `OVR ${tryout.age}` : '', tryout.requirements || ''].filter(Boolean).join(' | ') || 'Nao informado',
    '',
    'Observacoes:',
    tryout.notes || 'Sem observacoes.',
    '',
    'Interessados devem acessar o site e realizar o cadastro.',
  ].join('\n');
}

function makeCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = addDays(first, -startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(start, index);
    return {
      key: toDateKey(date),
      date,
      day: date.getDate(),
      currentMonth: date.getMonth() === month,
      today: toDateKey(date) === toDateKey(new Date()),
    };
  });
}

function readSavedUsers() {
  try {
    const saved = JSON.parse(localStorage.getItem(localUsersKey) || '[]');
    return Array.isArray(saved) ? saved.map(normalizeUser) : initialUsers;
  } catch {
    return initialUsers;
  }
}

function readSavedPlayers() {
  try {
    const saved = JSON.parse(localStorage.getItem(localPlayersKey) || '[]');
    return Array.isArray(saved) ? saved.map(normalizePlayer) : initialPlayers;
  } catch {
    return initialPlayers;
  }
}

function readSavedNotificationPreferences() {
  try {
    return {
      ...defaultNotificationPreferences,
      ...JSON.parse(localStorage.getItem(localNotificationPreferencesKey) || '{}'),
    };
  } catch {
    return defaultNotificationPreferences;
  }
}

function normalizeChampionshipItem(championship) {
  return {
    ...championship,
    id: championship.id || `local-championship-${Date.now()}`,
    name: championship.name || 'Campeonato',
    status: championship.status || 'futuro',
  };
}

function readSavedChampionships() {
  try {
    const saved = JSON.parse(localStorage.getItem(localChampionshipsKey) || '[]');
    return Array.isArray(saved) ? saved.map(normalizeChampionshipItem) : [];
  } catch {
    return [];
  }
}

function normalizeTryoutPlayers(players = []) {
  return (Array.isArray(players) ? players : [])
    .map((player, index) => ({
      id: player.id || `candidate-${index}`,
      name: String(player.name || player.fullName || '').trim(),
      position: String(player.position || 'Atacante').trim() || 'Atacante',
    }))
    .filter((player) => player.name);
}

function parseTryoutRequirements(requirements = '') {
  if (!requirements || typeof requirements !== 'string') return { players: [], requirements: '' };

  try {
    const parsed = JSON.parse(requirements);
    if (Array.isArray(parsed?.players)) {
      return {
        players: normalizeTryoutPlayers(parsed.players),
        requirements: parsed.requirements || '',
      };
    }
  } catch {
    // Requisitos antigos continuam como texto livre.
  }

  return { players: [], requirements };
}

function summarizeTryoutPlayers(players = []) {
  const normalized = normalizeTryoutPlayers(players);
  if (normalized.length === 0) return 'Jogadores a definir';
  if (normalized.length === 1) return `${normalized[0].name} (${normalized[0].position})`;
  return `${normalized.length} jogadores: ${normalized.map((player) => `${player.name} - ${player.position}`).join(', ')}`;
}

function normalizeTryout(tryout) {
  const parsedRequirements = parseTryoutRequirements(tryout.requirements);
  const players = normalizeTryoutPlayers(tryout.players || tryout.candidates || parsedRequirements.players);
  const fullName = tryout.fullName || tryout.title || (players.length ? summarizeTryoutPlayers(players) : 'Novo jogador');
  const position = tryout.position || tryout.category || (players.length ? [...new Set(players.map((player) => player.position))].join(', ') : 'Geral');

  return {
    ...tryout,
    id: tryout.id || Date.now(),
    fullName,
    players,
    age: tryout.age || tryout.overall || '',
    position,
    contact: tryout.contact || '',
    date: tryout.date || tryout.tryoutDate || toDateKey(new Date()),
    time: tryout.time || tryout.tryoutTime || 'A definir',
    place: (tryout.place || tryout.location) === 'Arena Society Norte' ? 'EA FC 26 | Clubs' : (tryout.place || tryout.location || 'EA FC 26 | Clubs'),
    notes: (tryout.notes || tryout.observations)?.toLowerCase().includes('chuteira')
      ? 'Teste em lobby privado. Entrar 10 min antes e usar headset.'
      : (tryout.notes || tryout.observations || ''),
    requirements: parsedRequirements.requirements || tryout.requirements || '',
    status: tryout.status || 'Agendada',
  };
}

function normalizeUser(user) {
  return {
    id: user.id || `u-${Date.now()}`,
    backendId: user.backendId || user.backend_id || '',
    name: user.name || user.nickname || 'Jogador TorinnoFC',
    nickname: user.nickname || user.name || 'Jogador',
    email: user.email || '',
    role: user.role === 'admin' ? 'admin' : 'player',
    staffRole: user.staffRole || (user.role === 'admin' ? 'Admin' : 'Jogador'),
    accountStatus: user.accountStatus || user.account_status || 'active',
    joinedAt: user.joinedAt || user.joined_at || '',
    position: user.position || 'Meio-campo',
    shirt: String(user.shirt || '10'),
    playerId: user.playerId || user.player?.id || '',
    hasPlayerProfile: user.hasPlayerProfile || Boolean(user.playerId || user.player?.id),
    photo: user.photo || '',
    localOnly: Boolean(user.localOnly),
    permissions: user.permissions || {},
  };
}

function normalizePlayer(player) {
  return {
    ...player,
    id: player.id || Date.now(),
    userId: player.userId,
    fullName: player.fullName || player.nickname || 'Jogador TorinnoFC',
    nickname: player.nickname || player.fullName || 'Jogador',
    position: player.position || 'Meio-campo',
    shirt: Number(player.shirt) || 0,
    avatar: player.avatar || getInitials(player.nickname || player.fullName),
    bio: player.bio || 'Jogador cadastrado na plataforma TorinnoFC.',
    stats: {
      goals: Number(player.stats?.goals) || 0,
      assists: Number(player.stats?.assists) || 0,
      recoveries: Number(player.stats?.recoveries) || 0,
      matches: Number(player.stats?.matches) || 0,
      wins: Number(player.stats?.wins) || 0,
      draws: Number(player.stats?.draws) || 0,
      losses: Number(player.stats?.losses) || 0,
      rating: Number(player.stats?.rating) || 0,
      shots: Number(player.stats?.shots) || 0,
      passes: Number(player.stats?.passes) || 0,
      tackles: Number(player.stats?.tackles) || 0,
      interceptions: Number(player.stats?.interceptions) || 0,
      yellow: Number(player.stats?.yellow) || 0,
      red: Number(player.stats?.red) || 0,
      notes: player.stats?.notes || '',
    },
  };
}

function mergePlayers(...groups) {
  const map = new Map();

  for (const group of groups) {
    for (const item of group || []) {
      const player = normalizePlayer(item);
      const key = player.userId || player.id;
      const existingKey = [...map.entries()].find(([, saved]) => (
        saved.id === player.id
        || (saved.userId && player.userId && saved.userId === player.userId)
      ))?.[0] || key;
      map.set(existingKey, { ...map.get(existingKey), ...player });
    }
  }

  return [...map.values()];
}

function mergeUsers(...groups) {
  const map = new Map();

  for (const group of groups) {
    for (const item of group || []) {
      const user = normalizeUser(item);
      const key = normalizeEmail(user.email) || user.id;
      map.set(key, { ...map.get(key), ...user });
    }
  }

  return [...map.values()];
}

function mergeById(normalizer, ...groups) {
  const map = new Map();

  for (const group of groups) {
    for (const item of group || []) {
      const normalized = normalizer(item);
      map.set(normalized.id, { ...map.get(normalized.id), ...normalized });
    }
  }

  return [...map.values()];
}

function readLocalMatchPerformances() {
  try {
    const saved = JSON.parse(localStorage.getItem(localMatchPerformancesKey) || '{}');
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
}

function writeLocalMatchPerformance(matchId, playerId, performance) {
  const entries = readLocalMatchPerformances();
  const key = `${matchId}:${playerId}`;
  const previous = entries[key] || null;
  entries[key] = performance;
  localStorage.setItem(localMatchPerformancesKey, JSON.stringify(entries));
  return previous;
}

function getScoreOutcome(score = '') {
  const [homeScore, awayScore] = String(score || '')
    .split('x')
    .map((value) => Number(value.trim()));

  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return '';
  if (homeScore > awayScore) return 'win';
  if (homeScore < awayScore) return 'loss';
  return 'draw';
}

function applyPerformanceDelta(player, nextPerformance, previousPerformance = null) {
  const stats = player.stats || {};
  const numeric = (value) => Number(value) || 0;
  const outcomeDelta = (outcome) => (
    (nextPerformance.outcome === outcome ? 1 : 0) - (previousPerformance?.outcome === outcome ? 1 : 0)
  );
  const nextRating = numeric(nextPerformance.rating);
  const previousRating = numeric(previousPerformance?.rating);
  const previousMatches = numeric(stats.matches);
  const matchDelta = previousPerformance ? 0 : 1;
  const matches = Math.max(previousMatches + matchDelta, previousPerformance ? 1 : matchDelta);
  const ratingBase = previousPerformance
    ? (numeric(stats.rating) * Math.max(previousMatches, 1)) - previousRating + nextRating
    : (numeric(stats.rating) * previousMatches) + nextRating;

  return normalizePlayer({
    ...player,
    stats: {
      ...stats,
      goals: numeric(stats.goals) + numeric(nextPerformance.goals) - numeric(previousPerformance?.goals),
      assists: numeric(stats.assists) + numeric(nextPerformance.assists) - numeric(previousPerformance?.assists),
      recoveries: numeric(stats.recoveries) + numeric(nextPerformance.recoveries) - numeric(previousPerformance?.recoveries),
      shots: numeric(stats.shots) + numeric(nextPerformance.shots) - numeric(previousPerformance?.shots),
      passes: numeric(stats.passes) + numeric(nextPerformance.passes) - numeric(previousPerformance?.passes),
      tackles: numeric(stats.tackles) + numeric(nextPerformance.tackles) - numeric(previousPerformance?.tackles),
      interceptions: numeric(stats.interceptions) + numeric(nextPerformance.interceptions) - numeric(previousPerformance?.interceptions),
      yellow: numeric(stats.yellow) + numeric(nextPerformance.yellow) - numeric(previousPerformance?.yellow),
      red: numeric(stats.red) + numeric(nextPerformance.red) - numeric(previousPerformance?.red),
      matches,
      wins: numeric(stats.wins) + outcomeDelta('win'),
      draws: numeric(stats.draws) + outcomeDelta('draw'),
      losses: numeric(stats.losses) + outcomeDelta('loss'),
      rating: matches ? Math.round((ratingBase / matches) * 10) / 10 : 0,
    },
  });
}

function mergeNotifications(...groups) {
  const map = new Map();

  for (const group of groups) {
    for (const notification of group || []) {
      if (!notification?.id) continue;
      map.set(notification.id, { ...map.get(notification.id), ...notification });
    }
  }

  return [...map.values()].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function makePlatformNotifications({ players = [], matches = [], tryouts = [], championships = [], activities = [] }) {
  const activityItems = activities.map((activity) => ({
    id: `local-activity-${activity.id}`,
    type: activity.type || 'admin_activity',
    title: activity.actorName || 'Atualizacao do clube',
    message: activity.message,
    actionUrl: activity.actionUrl || '',
    metadata: activity.metadata || {},
    isRead: true,
    createdAt: activity.createdAt,
  }));

  const playerItems = players.map((player) => ({
    id: `local-player-notification-${player.id}`,
    type: 'member_joined',
    title: 'Jogador no elenco',
    message: `${player.nickname || player.fullName} esta cadastrado em Jogadores.`,
    actionUrl: '/players',
    metadata: { playerId: player.id },
    isRead: true,
    createdAt: player.createdAt || player.updatedAt || new Date().toISOString(),
  }));

  const matchItems = matches.map((match) => {
    const normalized = normalizeMatchEvent(match);
    return {
      id: `local-match-notification-${normalized.id}`,
      type: normalized.status === 'Encerrada' ? 'match_updated' : 'match_created',
      title: normalized.status === 'Encerrada' ? 'Resultado atualizado' : 'Partida agendada',
      message: `${normalized.home} x ${normalized.away} em ${formatDateLabel(normalized.dateKey)} as ${normalized.time || 'A definir'}.`,
      actionUrl: '/calendar',
      metadata: { matchId: normalized.id, whatsappUrl: normalized.whatsappUrl },
      isRead: true,
      createdAt: normalized.createdAt || normalized.updatedAt || normalized.dateKey || new Date().toISOString(),
    };
  });

  const tryoutItems = tryouts.map((tryout) => {
    const normalized = normalizeTryout(tryout);
    return {
      id: `local-tryout-notification-${normalized.id}`,
      type: 'tryout_created',
      title: 'Peneira agendada',
      message: `${summarizeTryoutPlayers(normalized.players)} em ${formatDateLabel(normalized.date)} as ${normalized.time || 'A definir'}.`,
      actionUrl: '/calendar',
      metadata: { tryoutId: normalized.id },
      isRead: true,
      createdAt: normalized.createdAt || normalized.updatedAt || normalized.date || new Date().toISOString(),
    };
  });

  const championshipItems = championships.map((championship) => ({
    id: `local-championship-notification-${championship.id}`,
    type: 'championship_created',
    title: 'Campeonato no calendario',
    message: `${championship.name} esta cadastrado na plataforma.`,
    actionUrl: '/championships',
    metadata: { championshipId: championship.id },
    isRead: true,
    createdAt: championship.createdAt || championship.updatedAt || championship.startDate || new Date().toISOString(),
  }));

  return mergeNotifications(activityItems, playerItems, matchItems, tryoutItems, championshipItems).slice(0, 80);
}

function publicUser(user) {
  const normalized = normalizeUser(user);
  const safeUser = { ...normalized };
  delete safeUser.password;
  return safeUser;
}

function roleLabel(role) {
  return role === 'admin' ? 'Administrador' : 'Jogador';
}

function canUser(user, permission) {
  return user?.role === 'admin' || user?.permissions?.[permission] === true;
}

function findPlayerForUser(user, players) {
  return players.find((player) => player.userId === user.id || player.id === user.playerId) || null;
}

function App() {
  const [users, setUsers] = useState(readSavedUsers);
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [view, setView] = useState(session ? 'dashboard' : 'landing');
  const [players, setPlayers] = useState(readSavedPlayers);
  const [matches, setMatches] = useState(initialMatches);
  const [championships, setChampionships] = useState(readSavedChampionships);
  const [serverState, setServerState] = useState({ loading: true, error: '' });
  const [notificationsState, setNotificationsState] = useState({ loading: false, error: '', items: [], unreadCount: 0 });
  const [notificationPreferences, setNotificationPreferences] = useState(readSavedNotificationPreferences);
  const [activities, setActivities] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [tryouts, setTryouts] = useState(initialTryouts);
  const [selectedPlayerId, setSelectedPlayerId] = useState(1);
  const [toast, setToast] = useState('');
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    localStorage.setItem(localUsersKey, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(localPlayersKey, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.removeItem(localMatchesKey);
    localStorage.removeItem(localTryoutsKey);
    localStorage.removeItem('torinnofc-session');
  }, []);

  useEffect(() => {
    localStorage.setItem(localChampionshipsKey, JSON.stringify(championships));
  }, [championships]);

  useEffect(() => {
    if (notificationPreferences) {
      localStorage.setItem(localNotificationPreferencesKey, JSON.stringify(notificationPreferences));
    }
  }, [notificationPreferences]);

  useEffect(() => {
    try {
      const savedSettings = JSON.parse(localStorage.getItem('torinnofc-settings') || '{}');
      const darkTheme = savedSettings?.appearance?.darkTheme !== false;
      document.documentElement.classList.toggle('light-theme', !darkTheme);
    } catch {
      document.documentElement.classList.remove('light-theme');
    }
  }, []);

  const refreshClubData = async ({ silent = false } = {}) => {
    if (!silent) {
      setServerState({ loading: true, error: '' });
    }

    const results = await Promise.allSettled([
      fetchMatches(),
      fetchChampionships(),
      fetchPlayers(),
      fetchTryouts(),
      fetchUsers(),
    ]);

    const [matchesResult, championshipsResult, playersResult, tryoutsResult, usersResult] = results;

    if (matchesResult.status === 'fulfilled') {
      setMatches(matchesResult.value.map(normalizeMatchEvent));
    }
    if (championshipsResult.status === 'fulfilled') {
      setChampionships(mergeById(normalizeChampionshipItem, readSavedChampionships(), championshipsResult.value));
    }
    if (playersResult.status === 'fulfilled') {
      const cachedPlayers = readSavedPlayers();
      setPlayers(mergePlayers(cachedPlayers, playersResult.value.map(normalizePlayer)));
    }
    if (tryoutsResult.status === 'fulfilled') {
      setTryouts(tryoutsResult.value.map(normalizeTryout));
    }
    if (usersResult.status === 'fulfilled') {
      const cachedUsers = readSavedUsers();
      const serverUsers = usersResult.value.map((user) => normalizeUser({
        ...user,
        id: user.id,
        backendId: user.id,
        role: user.role === 'admin' ? 'admin' : 'player',
      }));
      setUsers(mergeUsers(cachedUsers, serverUsers));
    }

    const failed = results.find((result) => result.status === 'rejected');
    if (failed) {
      const message = failed.reason?.message || 'Alguns dados ainda nao foram sincronizados pelo servidor.';
      setServerState({ loading: false, error: message });
      await refreshExperienceData({ silent: true });
      return false;
    }

    setServerState({ loading: false, error: '' });
    await refreshExperienceData({ silent: true });
    return true;
  };

  useEffect(() => {
    refreshClubData();
    const timer = window.setInterval(() => refreshClubData({ silent: true }), 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    const current = users.find((item) => item.id === session.id);
    if (!current) return;
    const nextSession = publicUser(current);
    if (JSON.stringify(nextSession) !== JSON.stringify(session)) {
      setSession(nextSession);
    }
  }, [users, session]);

  useEffect(() => {
    if (!session?.email) {
      setNotificationsState({ loading: false, error: '', items: [], unreadCount: 0 });
      return undefined;
    }

    let active = true;

    const loadNotifications = async ({ silent = false } = {}) => {
      if (!silent) {
        setNotificationsState((state) => ({ ...state, loading: true, error: '' }));
      }

      try {
        const payload = await fetchNotifications(session.email, { limit: 50 });
        if (!active) return;
        setNotificationsState({
          loading: false,
          error: '',
          items: payload.notifications || [],
          unreadCount: payload.unreadCount || 0,
        });
      } catch (error) {
        if (!active) return;
        if (import.meta.env.DEV) {
          console.error('[notifications]', error);
        }
        setNotificationsState((state) => ({
          ...state,
          loading: false,
          error: 'Nao foi possivel carregar as notificacoes.',
        }));
      }
    };

    const loadPreferences = async () => {
      try {
        const preferences = await fetchNotificationPreferences(session.email);
        if (active) setNotificationPreferences({ ...defaultNotificationPreferences, ...preferences });
      } catch {
        if (active) setNotificationPreferences(readSavedNotificationPreferences());
      }
    };

    loadNotifications();
    loadPreferences();
    const timer = window.setInterval(() => loadNotifications({ silent: true }), 5000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [session?.email]);

  const refreshExperienceData = async ({ silent = false } = {}) => {
    if (!session) {
      setActivities([]);
      setAchievements([]);
      return false;
    }

    try {
      const [nextActivities, nextAchievements] = await Promise.all([
        fetchActivities({ limit: 18 }).catch(() => []),
        fetchAchievements().catch(() => []),
      ]);
      setActivities(nextActivities);
      setAchievements(nextAchievements);
      return true;
    } catch (error) {
      if (!silent && import.meta.env.DEV) console.error('[experience]', error);
      return false;
    }
  };

  useEffect(() => {
    if (!session) {
      setActivities([]);
      setAchievements([]);
      return undefined;
    }

    refreshExperienceData();
    const timer = window.setInterval(() => refreshExperienceData({ silent: true }), 12000);

    return () => {
      window.clearInterval(timer);
    };
  }, [session?.id]);

  const completeSupabaseAuth = async (supabaseUser, { navigate = true } = {}) => {
    const email = normalizeEmail(supabaseUser.email);
    const metadata = supabaseUser.user_metadata || {};
    const existing = users.find((user) => user.email.toLowerCase() === email);
    let user = normalizeUser({
      ...existing,
      id: existing?.id || supabaseUser.id,
      name: metadata.name || existing?.name || email.split('@')[0],
      nickname: metadata.nickname || existing?.nickname || metadata.name || email.split('@')[0],
      email,
      position: metadata.position || existing?.position || 'Meio-campo',
      shirt: metadata.shirt || existing?.shirt || '10',
    });

    const synced = await apiSyncUser(user);
    if (synced.accountStatus && synced.accountStatus !== 'active') {
      await signOutSupabase().catch(() => null);
      throw new Error('Seu acesso a plataforma foi removido por um administrador.');
    }
    user = normalizeUser({
      ...user,
      id: synced.id,
      backendId: synced.id,
      role: synced.role,
      staffRole: synced.staffRole,
      accountStatus: synced.accountStatus,
      joinedAt: synced.joinedAt,
      permissions: synced.permissions,
      playerId: synced.playerId,
      hasPlayerProfile: Boolean(synced.playerId),
      localOnly: false,
    });
    if (synced.player) {
      setPlayers((items) => mergePlayers([normalizePlayer(synced.player)], items));
    }

    setUsers((items) => mergeUsers(items, [user]));

    setSession(publicUser(user));
    await refreshClubData({ silent: true });
    if (navigate) setView('dashboard');
    return { ok: true };
  };

  const completeServerRegistration = async (form) => {
    const email = normalizeEmail(form.email);
    const registered = await apiRegisterAccount({
      name: form.name.trim(),
      nickname: form.nickname.trim(),
      email,
      password: form.password,
      position: form.position,
      shirt: form.shirt,
    });

    if (registered?.requiresEmailConfirmation) {
      let confirmationSent = true;
      try {
        await resendSignupConfirmation(email);
      } catch {
        confirmationSent = false;
      }
      return {
        info: confirmationSent
          ? 'Cadastro salvo. Enviamos um link de confirmacao para seu e-mail. Confirme o endereco e depois entre com sua senha.'
          : 'Cadastro salvo, mas o e-mail de confirmacao nao foi enviado. Use o botao Reenviar confirmacao abaixo.',
        nextMode: 'login',
      };
    }

    const data = await signInWithPassword(email, form.password);
    if (!data.user) {
      return { info: 'Cadastro salvo. Entre com seu e-mail e senha para continuar.', nextMode: 'login' };
    }
    return completeSupabaseAuth(data.user);
  };

  useEffect(() => {
    let active = true;
    if (!hasSupabaseConfig) {
      setBooting(false);
      return undefined;
    }

    const restore = async (authSession, navigate = true) => {
      if (!active) return;
      if (!authSession?.user) {
        setSession(null);
        setBooting(false);
        return;
      }
      try {
        await completeSupabaseAuth(authSession.user, { navigate });
      } catch (error) {
        if (!active) return;
        setSession(null);
        setServerState((state) => ({ ...state, error: error.message || 'Nao foi possivel restaurar seu perfil.' }));
      } finally {
        if (active) setBooting(false);
      }
    };

    getAuthSession().then(restore).catch((error) => {
      if (active) {
        setServerState((state) => ({ ...state, error: error.message || 'Nao foi possivel restaurar a sessao.' }));
        setBooting(false);
      }
    });
    const unsubscribe = subscribeToAuthChanges((authSession) => restore(authSession, false));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.id) return undefined;
    let active = true;

    const validateAccountAccess = async () => {
      try {
        const current = await fetchCurrentUser();
        if (!active) return;
        if (current.accountStatus !== 'active') {
          await signOutSupabase().catch(() => null);
          setSession(null);
          setView('auth');
          setAuthMode('login');
          setServerState((state) => ({ ...state, error: 'Seu acesso a plataforma foi removido por um administrador.' }));
          return;
        }

        setUsers((items) => items.map((item) => (
          item.id === session.id || item.email?.toLowerCase() === current.email?.toLowerCase()
            ? normalizeUser({ ...item, ...current, backendId: current.id })
            : item
        )));
      } catch (error) {
        if (active && error?.status === 401) {
          setSession(null);
          setView('auth');
          setAuthMode('login');
        }
      }
    };

    validateAccountAccess();
    const timer = window.setInterval(validateAccountAccess, 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [session?.id]);

  const handleAuth = async (form, isRegister) => {
    const email = normalizeEmail(form.email);
    if (!isValidEmail(email)) {
      return { error: 'Digite um e-mail valido.' };
    }
    if (!hasSupabaseConfig) {
      return { error: 'Autenticacao indisponivel. Configure o Supabase no frontend.' };
    }

    if (isRegister) {
      try {
        return await completeServerRegistration(form);
      } catch (error) {
        return { error: authErrorMessage(error, error.message || 'Nao foi possivel criar a conta.') };
      }
    }

    try {
      const data = await signInWithPassword(email, form.password);
      if (data.user) {
        return completeSupabaseAuth(data.user);
      }
      return { error: 'E-mail ou senha incorretos.' };
    } catch (error) {
      return { error: authErrorMessage(error, 'E-mail ou senha incorretos.') };
    }
  };

  const notify = (message) => {
    setToast(message);
    if (/vitoria|vit[oó]ria|promov|conquista|sequencia|sequ[eê]ncia/i.test(message)) {
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), 1600);
    }
    window.setTimeout(() => setToast(''), 2200);
  };

  const saveMatch = async (match, existingId) => {
    const payload = toMatchPayload(match);
    const saved = existingId
      ? await apiUpdateMatch(existingId, payload)
      : await apiCreateMatch(payload);

    setMatches((items) => {
      const normalized = normalizeMatchEvent(saved);
      return existingId
        ? items.map((item) => (item.id === existingId ? normalized : item))
        : [...items, normalized];
    });
    await refreshClubData({ silent: true });
    return saved;
  };

  const removeMatch = async (matchId) => {
    await apiDeleteMatch(matchId);
    setMatches((items) => items.filter((match) => match.id !== matchId));
    await refreshClubData({ silent: true });
  };

  const saveChampionship = async (championship, existingId) => {
    const saved = existingId
      ? await apiUpdateChampionship(existingId, championship)
      : await apiCreateChampionship(championship);
    setChampionships((items) => (
      existingId
        ? items.map((item) => (item.id === existingId ? saved : item))
        : [saved, ...items]
    ));
    await refreshClubData({ silent: true });
    return saved;
  };

  const removeChampionship = async (championshipId) => {
    if (!String(championshipId).startsWith('local-')) {
      await apiDeleteChampionship(championshipId);
    }
    setChampionships((items) => items.filter((championship) => championship.id !== championshipId));
    await refreshClubData({ silent: true });
  };

  const createPlayer = async (player) => {
    const saved = await apiCreatePlayer(player);
    setPlayers((items) => [normalizePlayer(saved), ...items]);
    await refreshClubData({ silent: true });
    return saved;
  };

  const updatePlayerStats = async (playerId, stats) => {
    const saved = await apiUpdatePlayerStats(playerId, stats);
    setPlayers((items) => items.map((player) => (player.id === playerId ? normalizePlayer(saved) : player)));
    await refreshClubData({ silent: true });
    return saved;
  };

  const removePlayer = async (playerId) => {
    await apiDeletePlayer(playerId);
    setPlayers((items) => items.filter((player) => player.id !== playerId));
    await refreshClubData({ silent: true });
  };

  const setUserRole = async (account, nextRole) => {
    if (!account.backendId) {
      const synced = await apiSyncUser(account);
      account.backendId = synced.id;
    }
    const updated = await apiUpdateUserRole(account.backendId, nextRole);
    const normalizedUpdated = normalizeUser({
      ...account,
      id: updated.id,
      backendId: updated.id,
      role: updated.role,
      staffRole: updated.staffRole,
      playerId: updated.playerId || account.playerId,
      hasPlayerProfile: updated.hasPlayerProfile ?? account.hasPlayerProfile,
    });
    setUsers((items) =>
      items.map((item) =>
        item.id === account.id
          ? normalizedUpdated
          : item,
      ),
    );
    if (session?.id === account.id || session?.email?.toLowerCase() === account.email?.toLowerCase()) {
      setSession(publicUser(normalizedUpdated));
      if (updated.role !== 'admin' && view === 'admin') {
        setView('dashboard');
      }
    }
    await refreshClubData({ silent: true });
    return updated;
  };

  const refreshNotifications = async () => {
    if (!session?.email) return;
    try {
      const payload = await fetchNotifications(session.email, { limit: 50 });
      setNotificationsState({
        loading: false,
        error: '',
        items: payload.notifications || [],
        unreadCount: payload.unreadCount || 0,
      });
    } catch {
      setNotificationsState((state) => ({
        ...state,
        loading: false,
        error: 'Nao foi possivel carregar notificacoes do servidor.',
      }));
    }
  };

  const markNotificationRead = async (id, isRead = true) => {
    if (!session?.email) return;
    if (String(id).startsWith('local-')) return;
    await apiMarkNotificationRead(id, session.email, isRead);
    await refreshNotifications();
  };

  const markAllNotificationsRead = async () => {
    if (!session?.email) return;
    if (notificationsState.items.length === 0) return;
    await apiMarkAllNotificationsRead(session.email);
    await refreshNotifications();
  };

  const deleteNotification = async (id) => {
    if (!session?.email) return;
    if (String(id).startsWith('local-')) return;
    await apiDeleteNotification(id, session.email);
    await refreshNotifications();
  };

  const saveNotificationPreferences = async (preferences) => {
    if (!session?.email) return;
    let saved = preferences;
    try {
      saved = { ...defaultNotificationPreferences, ...await updateNotificationPreferences(session.email, preferences) };
    } catch {
      saved = preferences;
    }
    await refreshClubData({ silent: true });
    setNotificationPreferences(saved);
    notify('Preferencias de notificacoes atualizadas.');
  };

  const logout = async ({ allDevices = false } = {}) => {
    if (allDevices && !window.confirm('Sair desta conta em todos os dispositivos?')) {
      return;
    }

    try {
      if (hasSupabaseConfig) await signOutSupabase({ allDevices });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[logout]', error);
      }
    } finally {
      localStorage.removeItem('torinnofc-session');
      setNotificationsState({ loading: false, error: '', items: [], unreadCount: 0 });
      setNotificationPreferences(null);
      setSession(null);
      setView('auth');
      setAuthMode('login');
      notify(allDevices ? 'Conta desconectada em todos os dispositivos.' : 'Voce saiu da conta.');
    }
  };

  const logoutAllDevices = () => {
    logout({ allDevices: true });
  };

  const logoutCurrentDevice = () => {
    logout();
  };

  const openLoginWithAnotherAccount = async () => {
    await logout();
    setAuthMode('login');
    setSession(null);
    setView('auth');
  };

  if (booting) {
    return <Preloader />;
  }

  if (!session) {
    if (view === 'auth') {
      return <AuthScreen mode={authMode} setMode={setAuthMode} onAuth={handleAuth} onBack={() => setView('landing')} />;
    }

    return (
      <Landing
        onLogin={() => {
          setAuthMode('login');
          setView('auth');
        }}
        onRegister={() => {
          setAuthMode('register');
          setView('auth');
        }}
      />
    );
  }

  const platformNotifications = makePlatformNotifications({ players, matches, tryouts, championships, activities });
  const combinedNotificationsState = {
    ...notificationsState,
    items: mergeNotifications(notificationsState.items, platformNotifications),
    unreadCount: notificationsState.unreadCount || 0,
  };

  return (
    <DashboardShell
      user={session}
      view={view}
      setView={setView}
      onLogout={logout}
      onLogoutAllDevices={logoutAllDevices}
      notificationsState={combinedNotificationsState}
      markNotificationRead={markNotificationRead}
      markAllNotificationsRead={markAllNotificationsRead}
      refreshNotifications={refreshNotifications}
    >
      <PageRouter
        view={view}
        setView={setView}
        user={session}
        setUser={setSession}
        users={users}
        setUsers={setUsers}
        players={players}
        setPlayers={setPlayers}
        matches={matches}
        setMatches={setMatches}
        saveMatch={saveMatch}
        removeMatch={removeMatch}
        championships={championships}
        saveChampionship={saveChampionship}
        removeChampionship={removeChampionship}
        createPlayer={createPlayer}
        updatePlayerStats={updatePlayerStats}
        removePlayer={removePlayer}
        serverState={serverState}
        setUserRole={setUserRole}
        notificationsState={combinedNotificationsState}
        markNotificationRead={markNotificationRead}
        markAllNotificationsRead={markAllNotificationsRead}
        deleteNotification={deleteNotification}
        refreshNotifications={refreshNotifications}
        notificationPreferences={notificationPreferences}
        saveNotificationPreferences={saveNotificationPreferences}
        refreshClubData={refreshClubData}
        activities={activities}
        achievements={achievements}
        tryouts={tryouts}
        setTryouts={setTryouts}
        selectedPlayerId={selectedPlayerId}
        setSelectedPlayerId={setSelectedPlayerId}
        notify={notify}
        onLogout={logoutCurrentDevice}
        onLogoutAllDevices={logoutAllDevices}
        onSwitchAccount={openLoginWithAnotherAccount}
      />
      {celebrating && <CelebrationBurst />}
      {toast && <Toast message={toast} />}
    </DashboardShell>
  );
}

function Preloader() {
  return (
    <main className="preloader">
      <img className="preloader-bg" src={banner} alt="" />
      <section className="preloader-content">
        <div className="crest-stage">
          <img src={logo} alt="TorinnoFC" />
        </div>

        <span className="preloader-kicker">
          <Sparkles size={16} />
          Est. 2026 | Plataforma oficial
        </span>
        <h1>
          Torinno FC
        </h1>
        <p>Joga bonito, compete serio, representa sempre.</p>
        <div className="preloader-actions" aria-hidden="true">
          <span className="preloader-button primary">
            Entrar na Plataforma
            <ChevronRight size={16} />
          </span>
          <span className="preloader-button secondary">Cadastrar Jogador</span>
        </div>
      </section>
    </main>
  );
}

function Landing({ onLogin, onRegister }) {
  return (
    <main className="landing">
      <section className="hero">
        <img className="hero-bg" src={banner} alt="" />
        <div className="hero-content">
          <img className="hero-crest" src={logo} alt="Escudo TorinnoFC" />
          <div className="eyebrow">
            <Sparkles size={16} />
            Est. 2026 | Plataforma oficial
          </div>
          <h1>
            <span className="hero-name">Torinno</span>
            <span className="hero-fc">FC</span>
          </h1>
          <p>Joga bonito, compete serio, representa sempre.</p>
          <div className="hero-actions">
            <button className="button primary" type="button" onClick={onLogin}>
              Entrar na Plataforma
              <ChevronRight size={18} />
            </button>
            <button className="button secondary" type="button" onClick={onRegister}>
              Cadastrar Jogador
            </button>
          </div>
        </div>
        <div className="hero-stars" aria-hidden="true">
          <Star size={20} />
          <Star size={15} />
          <Star size={12} />
          <Star size={9} />
          <Star size={7} />
        </div>
      </section>
    </main>
  );
}

function AuthScreen({ mode, setMode, onAuth, onBack }) {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: '',
    nickname: '',
    email: '',
    password: '',
    position: 'Meio-campo',
    shirt: '10',
    website: '',
  });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);

  const isRegister = mode === 'register';

  const submit = async (event) => {
    event.preventDefault();
    if (form.website) {
      setError('Verificacao bloqueada. Tente novamente.');
      return;
    }
    const email = normalizeEmail(form.email);
    if (!isValidEmail(email)) {
      setError('Digite um e-mail valido.');
      return;
    }
    if (form.password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (isRegister && (!form.name.trim() || !form.nickname.trim())) {
      setError('Preencha nome completo e apelido.');
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await onAuth({ ...form, email }, isRegister);
      if (result?.error) {
        setError(result.error);
        setInfo('');
        return;
      }
      if (result?.info) {
        setError('');
        setInfo(result.info);
        if (result.nextMode) setMode(result.nextMode);
        return;
      }

      setError('');
      setInfo('');
    } finally {
      setSubmitting(false);
    }
  };

  const sendPasswordReset = async () => {
    if (resettingPassword) return;
    const email = normalizeEmail(form.email);
    if (!isValidEmail(email)) {
      setError('Digite um e-mail valido para recuperar a senha.');
      return;
    }
    if (!hasSupabaseConfig) {
      setError('Recuperacao de senha exige Supabase configurado.');
      return;
    }

    setResettingPassword(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (resetError) {
        setError(authErrorMessage(resetError, 'Nao foi possivel enviar o link de recuperacao.'));
        return;
      }
      setError('');
      setInfo('Se o e-mail estiver cadastrado, enviaremos um link de recuperacao.');
    } catch (resetError) {
      setError(authErrorMessage(resetError, 'Nao foi possivel enviar o link de recuperacao.'));
    } finally {
      setResettingPassword(false);
    }
  };

  const resendConfirmation = async () => {
    if (resendingConfirmation) return;
    const email = normalizeEmail(form.email);
    if (!isValidEmail(email)) {
      setError('Digite um e-mail valido para reenviar a confirmacao.');
      return;
    }
    setResendingConfirmation(true);
    try {
      await resendSignupConfirmation(email);
      setError('');
      setInfo('Novo link de confirmacao enviado. Confira também a pasta de spam.');
    } catch (confirmationError) {
      setError(authErrorMessage(confirmationError, 'Nao foi possivel reenviar a confirmacao agora.'));
    } finally {
      setResendingConfirmation(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <img src={banner} alt="" />
        <button className="brand-mark floating" type="button" onClick={onBack}>
          <img src={logo} alt="" />
          <span>TorinnoFC</span>
        </button>
        <div>
          <p>Area oficial</p>
          <h1>{isRegister ? 'CADASTRO DE JOGADOR' : 'ENTRAR NA PLATAFORMA'}</h1>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>
            Login
          </button>
          <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => setMode('register')}>
            Cadastro
          </button>
        </div>

        <form onSubmit={submit}>
          <input
            className="bot-trap"
            tabIndex="-1"
            autoComplete="off"
            value={form.website}
            onChange={(event) => setForm({ ...form, website: event.target.value })}
          />
          {isRegister && (
            <>
              <Field label="Nome completo" value={form.name} onChange={(name) => setForm({ ...form, name })} />
              <Field label="Apelido no time" value={form.nickname} onChange={(nickname) => setForm({ ...form, nickname })} />
            </>
          )}
          <Field label="E-mail" type="email" value={form.email} required autoComplete="email" onChange={(email) => setForm({ ...form, email })} />
          <label className="field">
            <span>Senha</span>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="minimo 6 caracteres"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Mostrar senha">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {isRegister && (
            <div className="form-grid">
              <label className="field">
                <span>Posicao</span>
                <select value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })}>
                  {positions.map((position) => (
                    <option key={position}>{position}</option>
                  ))}
                </select>
              </label>
              <Field label="Camisa" type="number" value={form.shirt} onChange={(shirt) => setForm({ ...form, shirt })} />
            </div>
          )}
          {error && <p className="form-error">{error}</p>}
          {info && <p className="form-info">{info}</p>}
          <button className="button primary full" type="submit" disabled={submitting}>
            {submitting ? (isRegister ? 'Criando...' : 'Entrando...') : (isRegister ? 'Criar conta' : 'Entrar')}
            <ChevronRight size={18} />
          </button>
          <div className="auth-help-actions">
            {!isRegister && (
              <button className="button minimal" type="button" disabled={resendingConfirmation} onClick={resendConfirmation}>
                {resendingConfirmation ? 'Reenviando...' : 'Reenviar confirmacao'}
              </button>
            )}
            <button className="button minimal" type="button" disabled={resettingPassword} onClick={sendPasswordReset}>
              {resettingPassword ? 'Enviando...' : 'Recuperar senha'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function DashboardShell({ children, user, view, setView, notificationsState, markNotificationRead, markAllNotificationsRead, refreshNotifications }) {
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unreadCount = notificationsState?.unreadCount || 0;
  const badgeLabel = unreadCount > 99 ? '99+' : unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <main className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-head">
          <img src={logo} alt="TorinnoFC" />
          <div>
            <strong>TorinnoFC</strong>
            <span>Digital</span>
          </div>
          <button className="icon-button mobile-close" type="button" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="user-card">
          <div className="avatar">{getInitials(user.nickname || user.name)}</div>
          <div>
            <strong>{user.nickname || user.name}</strong>
            <span>{user.staffRole || roleLabel(user.role)}</span>
          </div>
        </div>

        <nav className="side-nav">
          {navItems.filter((item) => item.id !== 'admin' || user.role === 'admin').map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={view === item.id ? 'active' : ''}
                type="button"
                onClick={() => {
                  setView(item.id);
                  setOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

      </aside>

      <section className="content-area">
        <header className="topbar">
          <button className="icon-button menu-button" type="button" onClick={() => setOpen(true)}>
            <Menu size={21} />
          </button>
          <div>
            <span>TorinnoFC</span>
            <strong>{pageTitle(view)}</strong>
          </div>
          <div className="notification-wrap">
            <button className={`notification ${unreadCount > 0 ? 'has-unread' : ''}`} type="button" onClick={() => setNotificationsOpen(!notificationsOpen)} aria-label="Abrir notificacoes">
              <Bell size={18} />
              {unreadCount > 0 && <small>{badgeLabel}</small>}
            </button>
            {notificationsOpen && (
              <NotificationsPopover
                notificationsState={notificationsState}
                setView={setView}
                onClose={() => setNotificationsOpen(false)}
                onMarkRead={markNotificationRead}
                onMarkAllRead={markAllNotificationsRead}
                onRetry={refreshNotifications}
              />
            )}
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

function NotificationsPopover({ notificationsState, setView, onClose, onMarkRead, onMarkAllRead, onRetry }) {
  const items = (notificationsState?.items || []).slice(0, 6);
  const hasUnread = (notificationsState?.unreadCount || 0) > 0;

  const openNotification = async (notification) => {
    if (!notification.isRead) {
      await onMarkRead(notification.id, true);
    }
    navigateFromNotification(notification, setView);
    onClose();
  };

  return (
    <div className="notifications-popover">
      <div className="notifications-popover-head">
        <div>
          <strong>Notificacoes</strong>
          <span>{hasUnread ? `${notificationsState.unreadCount} nao lida(s)` : 'Sem notificacoes nao lidas'}</span>
        </div>
        {hasUnread && (
          <button className="button minimal small" type="button" onClick={onMarkAllRead}>
            Marcar todas
          </button>
        )}
      </div>
      {notificationsState?.loading && <div className="empty-state">Carregando notificacoes...</div>}
      {!notificationsState?.loading && notificationsState?.error && (
        <div className="empty-state notification-empty">
          <Bell size={22} />
          <strong>{notificationsState.error}</strong>
          <span>Verifique sua conexao e tente novamente.</span>
          <button className="button minimal small" type="button" onClick={onRetry}>Tentar novamente</button>
        </div>
      )}
      {!notificationsState?.loading && !notificationsState?.error && items.length === 0 && (
        <div className="empty-state notification-empty">
          <Bell size={22} />
          <strong>Nao ha notificacoes no momento.</strong>
          <span>Novas partidas, atualizacoes do elenco e avisos importantes aparecerao aqui.</span>
        </div>
      )}
      <div className="notifications-list compact">
        {items.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onOpen={() => openNotification(notification)}
            onToggleRead={() => onMarkRead(notification.id, !notification.isRead)}
          />
        ))}
      </div>
      <button
        className="button secondary full"
        type="button"
        onClick={() => {
          setView('notifications');
          onClose();
        }}
      >
        Ver todas as notificacoes
      </button>
    </div>
  );
}

function NotificationsPage({ notificationsState, markNotificationRead, markAllNotificationsRead, deleteNotification, refreshNotifications, setView, notify }) {
  const [filter, setFilter] = useState('Todas');
  const categoryMap = {
    Todas: null,
    'Nao lidas': 'unread',
    Partidas: 'match',
    Peneiras: 'tryout',
    Campeonatos: 'championship',
    Elenco: 'member',
    Estatisticas: 'statistics',
    Administracao: 'admin',
  };
  const items = (notificationsState?.items || []).filter((notification) => {
    const category = categoryMap[filter];
    if (!category) return true;
    if (category === 'unread') return !notification.isRead;
    return notificationCategory(notification.type) === category;
  });
  const grouped = groupNotificationsByDate(items);

  const openNotification = async (notification) => {
    if (!notification.isRead) {
      await markNotificationRead(notification.id, true);
    }
    navigateFromNotification(notification, setView);
  };

  return (
    <section>
      <div className="section-title-actions">
        <SectionHeader eyebrow="Central" title="Notificacoes" />
        <button
          className="button minimal"
          type="button"
          onClick={async () => {
            try {
              await markAllNotificationsRead();
              notify('Todas as notificacoes foram marcadas como lidas.');
            } catch {
              notify('Notificacoes locais ja estao atualizadas.');
            }
          }}
        >
          Marcar todas como lidas
        </button>
      </div>
      <div className="calendar-filters notification-filters">
        {Object.keys(categoryMap).map((item) => (
          <button className={filter === item ? 'active' : ''} key={item} type="button" onClick={() => setFilter(item)}>
            {item}
          </button>
        ))}
      </div>
      {notificationsState?.loading && <div className="empty-state">Carregando notificacoes...</div>}
      {!notificationsState?.loading && notificationsState?.error && items.length === 0 && (
        <div className="empty-state-card notification-empty-page">
          <div className="icon-tile gold">
            <Bell size={16} />
          </div>
          <div>
            <strong>{notificationsState.error}</strong>
            <span>Verifique sua conexao e tente novamente.</span>
          </div>
          <button className="button minimal small" type="button" onClick={refreshNotifications}>
            Tentar novamente
          </button>
        </div>
      )}
      {!notificationsState?.loading && notificationsState?.error && items.length > 0 && (
        <div className="settings-warning">Mostrando atualizacoes locais enquanto o servidor de notificacoes nao responde.</div>
      )}
      {!notificationsState?.loading && !notificationsState?.error && items.length === 0 && (
        <EmptyState icon={Bell} title="Nao ha notificacoes no momento." description="Novas partidas, atualizacoes do elenco e avisos importantes aparecerao aqui." />
      )}
      <div className="notifications-page-list">
        {Object.entries(grouped).map(([group, notifications]) => (
          <div className="notification-group" key={group}>
            <h3>{group}</h3>
            <div className="notifications-list">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onOpen={() => openNotification(notification)}
                  onToggleRead={() => markNotificationRead(notification.id, !notification.isRead)}
                  onDelete={String(notification.id).startsWith('local-') ? null : async () => {
                    await deleteNotification(notification.id);
                    notify('Notificacao excluida.');
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function NotificationItem({ notification, onOpen, onToggleRead, onDelete }) {
  const Icon = notificationIcon(notification.type);

  return (
    <article className={`notification-item ${notification.isRead ? '' : 'unread'} ${notification.type.includes('1h') ? 'urgent' : ''}`}>
      <button className="notification-main" type="button" onClick={onOpen}>
        <span className={`notification-type ${notificationCategory(notification.type)}`}>
          <Icon size={16} />
        </span>
        <span>
          <strong>{notification.title}</strong>
          <small>{notification.message}</small>
          <em>{formatDateTime(notification.createdAt)}</em>
        </span>
      </button>
      <div className="notification-actions">
        {notification.metadata?.whatsappUrl && (
          <button className="button minimal small" type="button" onClick={() => window.open(notification.metadata.whatsappUrl, '_blank', 'noopener,noreferrer')}>
            WhatsApp
          </button>
        )}
        <button className="button minimal small" type="button" onClick={onToggleRead}>
          {notification.isRead ? 'Nao lida' : 'Lida'}
        </button>
        {onDelete && (
          <button className="button minimal small danger" type="button" onClick={onDelete}>
            Excluir
          </button>
        )}
      </div>
    </article>
  );
}

function PageRouter(props) {
  const { view } = props;
  const pages = {
    dashboard: <Dashboard {...props} />,
    profile: <Profile {...props} />,
    performance: <Performance {...props} />,
    players: <Players {...props} />,
    'player-detail': <PlayerDetail {...props} />,
    tryouts: <Tryouts {...props} />,
    matches: <Matches {...props} />,
    matchday: <Matchday {...props} />,
    calendar: <Calendar {...props} />,
    notifications: <NotificationsPage {...props} />,
    ranking: <Ranking {...props} />,
    compare: <PlayerCompare {...props} />,
    team: <Team {...props} />,
    championships: <Championships {...props} />,
    admin: <AdminPanel {...props} />,
    settings: <SettingsPage {...props} />,
    logout: <LogoutPage {...props} />,
  };

  return (
    <div className="page-transition" key={view}>
      <PageErrorBoundary resetKey={view} onRecover={() => props.setView('dashboard')}>
        {pages[view] || <Dashboard {...props} />}
      </PageErrorBoundary>
    </div>
  );
}

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[PageErrorBoundary] Falha ao renderizar pagina:', error, info);
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <section>
        <SectionHeader eyebrow="Recuperacao" title="Nao foi possivel abrir esta pagina" />
        <div className="panel page-error-card">
          <RefreshCw size={22} />
          <div>
            <strong>A plataforma continua funcionando.</strong>
            <span>Volte ao painel e tente novamente.</span>
          </div>
          <button className="button primary" type="button" onClick={this.props.onRecover}>
            Voltar ao painel
          </button>
        </div>
      </section>
    );
  }
}

function LogoutPage({ user, onLogout, onLogoutAllDevices, onSwitchAccount }) {
  return (
    <section className="logout-page">
      <SectionHeader eyebrow="Conta" title="Sair da conta" />
      <div className="logout-grid">
        <article className="panel logout-account-card">
          <div className="avatar">{getInitials(user.nickname || user.name)}</div>
          <div className="logout-account-copy">
            <strong>{user.name || user.nickname || 'Usuario TorinnoFC'}</strong>
            <span>{user.email}</span>
            <small>{user.staffRole || roleLabel(user.role)}</small>
          </div>
        </article>

        <article className="panel logout-action-card">
          <div className="logout-action-copy">
            <UserPlus size={20} />
            <div>
              <strong>Trocar conta</strong>
              <span>Fecha esta sessao e abre a tela de login para entrar com outro e-mail.</span>
            </div>
          </div>
          <button className="button secondary" type="button" onClick={() => onSwitchAccount()}>
            <UserPlus size={16} />
            Trocar conta
          </button>
        </article>

        <article className="panel logout-action-card">
          <div className="logout-action-copy">
            <LogOut size={20} />
            <div>
              <strong>Sair desta conta</strong>
              <span>Sai apenas deste aparelho e mantem outros dispositivos conectados.</span>
            </div>
          </div>
          <button className="button primary" type="button" onClick={() => onLogout()}>
            <LogOut size={16} />
            Sair
          </button>
        </article>

        <article className="panel logout-action-card danger">
          <div className="logout-action-copy">
            <ShieldCheck size={20} />
            <div>
              <strong>Sair de todos os dispositivos</strong>
              <span>Encerra a sessao da conta em todos os lugares conectados pelo Supabase.</span>
            </div>
          </div>
          <button className="button minimal danger" type="button" onClick={() => onLogoutAllDevices()}>
            <ShieldCheck size={16} />
            Sair de todos
          </button>
        </article>
      </div>
    </section>
  );
}

function Dashboard({ user, players, matches, championships = [], setView, notify, activities = [], setSelectedPlayerId }) {
  const endedMatches = matches.filter((match) => match.status === 'Encerrada');
  const teamStats = getTeamStats(players, matches);
  const myPlayer = findPlayerForUser(user, players);
  const isAdmin = user?.role === 'admin';

  return (
    <div className="page-grid">
      <section className="main-column">
        <div className="dashboard-welcome panel">
          <div className="icon-tile gold">
            <Shield size={18} />
          </div>
          <div>
            <span>Painel oficial</span>
            <h2>Bem-vindo, {user.nickname || user.name}</h2>
            <p>Resumo limpo do elenco, calendario e desempenho competitivo do TorrinoFC.</p>
          </div>
          <button className="button secondary" type="button" onClick={() => setView('profile')}>
            Meu perfil
          </button>
        </div>

        <div className="dashboard-metrics">
          <StatCard icon={Trophy} value={teamStats.hasFinishedMatches ? `${teamStats.winRate}%` : 'Sem dados'} label="Aproveitamento" />
          <StatCard icon={BarChart3} value={teamStats.totalGoals} label="Gols do elenco" />
          <StatCard icon={Users} value={players.length} label="Jogadores" />
          <StatCard icon={Star} value={teamStats.hasRatings ? teamStats.avgRating : 'Sem dados'} label="Nota media" />
        </div>

        <TeamInsights stats={teamStats} players={players} setView={setView} />

        <ActivityFeed activities={activities} setView={setView} setSelectedPlayerId={setSelectedPlayerId} />

        <article className="panel dashboard-panel">
          <div className="dashboard-panel-head">
            <div>
              <span>Desempenho</span>
              <h3>{isAdmin ? 'Resumo do elenco' : 'Resumo pessoal'}</h3>
            </div>
            <button className="action-link" type="button" onClick={() => setView(isAdmin ? 'ranking' : 'performance')}>
              {isAdmin ? 'Ranking' : 'Meu Desempenho'}
            </button>
          </div>
          {isAdmin ? (
            <div className="dashboard-list">
              <div className="dashboard-list-row"><strong>Total de jogadores</strong><small>{players.length}</small></div>
              <div className="dashboard-list-row"><strong>Com desempenho</strong><small>{players.filter((player) => player.stats.matches > 0).length}</small></div>
              <div className="dashboard-list-row"><strong>Gols e assistencias</strong><small>{teamStats.totalGoals} / {players.reduce((sum, player) => sum + player.stats.assists, 0)}</small></div>
              {players.filter((player) => player.stats.matches > 0).slice(0, 3).map((player) => (
                <div className="dashboard-list-row" key={player.id}>
                  <strong>{player.nickname}</strong>
                  <small>Nota {player.stats.rating || 0}</small>
                </div>
              ))}
              {players.every((player) => player.stats.matches === 0) && <EmptyState icon={Activity} title="Nenhum jogador possui estatisticas atualizadas." description="Cadastre desempenhos para visualizar o resumo do elenco." />}
            </div>
          ) : myPlayer ? (
            <div className="dashboard-list">
              <div className="dashboard-list-row"><strong>Partidas</strong><small>{myPlayer.stats.matches}</small></div>
              <div className="dashboard-list-row"><strong>Gols / Assistencias</strong><small>{myPlayer.stats.goals} / {myPlayer.stats.assists}</small></div>
              <div className="dashboard-list-row"><strong>Roubadas / Nota media</strong><small>{myPlayer.stats.recoveries} / {myPlayer.stats.rating || 0}</small></div>
              <div className="modal-actions">
                <button className="button secondary" type="button" onClick={() => setView('performance')}>Abrir Meu Desempenho</button>
                <button className="button secondary" type="button" onClick={() => downloadPerformanceReport({ format: 'pdf' }).catch((error) => notify?.(error.message))}>Baixar relatorio</button>
              </div>
            </div>
          ) : (
            <EmptyState icon={Activity} title="Nenhum desempenho registrado." description="Entre novamente para sincronizar seu jogador e registrar uma partida." />
          )}
        </article>

        <div className="dashboard-panels">
          <article className="panel dashboard-panel">
            <div className="dashboard-panel-head">
              <div>
                <span>Competicoes</span>
                <h3>Campeonatos recentes</h3>
              </div>
              <button className="action-link" type="button" onClick={() => setView('championships')}>
                Ver todos
              </button>
            </div>
            <div className="dashboard-list">
              {championships.slice(0, 4).map((championship, index) => (
                <div className="dashboard-list-row" key={championship.id}>
                  <div className={`icon-tile ${index === 0 ? 'green' : 'blue'}`}>
                    <Trophy size={16} />
                  </div>
                  <div>
                    <strong>{championship.name}</strong>
                    <span>{championship.season || championship.format || 'Campeonato cadastrado'}</span>
                  </div>
                  <small className={`status ${championship.status === 'em_andamento' ? 'live' : ''}`}>{championshipStatusLabel(championship.status)}</small>
                </div>
              ))}
              {championships.length === 0 && (
                <EmptyState icon={Trophy} title="Nenhum campeonato cadastrado." description="Quando um admin criar um campeonato, ele aparece aqui." action="Abrir campeonatos" onAction={() => setView('championships')} />
              )}
            </div>
          </article>

          <article className="panel dashboard-panel">
            <div className="dashboard-panel-head">
              <div>
                <span>Resultados</span>
                <h3>Jogos encerrados</h3>
              </div>
              <button className="action-link" type="button" onClick={() => setView('calendar')}>
                Calendario
              </button>
            </div>
            <div className="dashboard-list">
              {endedMatches.slice(0, 4).map((match) => (
                <div className="dashboard-list-row" key={match.id}>
                  <div className="icon-tile gold">
                    <Flag size={16} />
                  </div>
                  <div>
                    <strong>{match.home} x {match.away}</strong>
                    <span>{match.date}, {match.time} | {match.score}</span>
                  </div>
                </div>
              ))}
              {endedMatches.length === 0 && (
                <EmptyState icon={Flag} title="Nenhuma partida encerrada ainda" description="Quando um jogo for finalizado, ele aparece aqui." action="Abrir calendario" onAction={() => setView('calendar')} />
              )}
            </div>
          </article>
        </div>
      </section>

      <aside className="side-column">
        <div className="spotlight-card dashboard-side-card">
          <img src={logo} alt="" />
          <span>Identidade 2026</span>
          <h3>TorinnoFC</h3>
          <p>Clube organizado, dados vivos e desempenho acompanhando cada rodada.</p>
          <button className="button secondary full" type="button" onClick={() => setView('tryouts')}>
            Marcar teste
          </button>
        </div>
        <TopRanking players={players} />
      </aside>
    </div>
  );
}

function getTeamStats(players, matches) {
  const totals = players.reduce(
    (sum, player) => ({
      goals: sum.goals + (Number(player.stats?.goals) || 0),
      assists: sum.assists + (Number(player.stats?.assists) || 0),
      recoveries: sum.recoveries + (Number(player.stats?.recoveries) || 0),
      rating: sum.rating + (Number(player.stats?.rating) || 0),
      matches: sum.matches + (Number(player.stats?.matches) || 0),
    }),
    { goals: 0, assists: 0, recoveries: 0, rating: 0, matches: 0 },
  );

  const finished = matches.filter((match) => match.status === 'Encerrada');
  const wins = finished.filter((match) => {
    const [homeScore, awayScore] = String(match.score || '').split('x').map((value) => Number(value.trim()));
    return Number.isFinite(homeScore) && Number.isFinite(awayScore) && homeScore > awayScore;
  }).length;
  const draws = finished.filter((match) => {
    const [homeScore, awayScore] = String(match.score || '').split('x').map((value) => Number(value.trim()));
    return Number.isFinite(homeScore) && Number.isFinite(awayScore) && homeScore === awayScore;
  }).length;
  const losses = Math.max(finished.length - wins - draws, 0);
  const playersWithRating = players.filter((player) => Number(player.stats?.rating) > 0);
  const avgRating = playersWithRating.length ? (playersWithRating.reduce((sum, player) => sum + Number(player.stats?.rating || 0), 0) / playersWithRating.length).toFixed(1) : '0.0';
  const winRate = finished.length ? Math.round((wins / finished.length) * 100) : 0;
  const positionCounts = players.reduce((items, player) => {
    const key = player.position || 'Sem posicao';
    items[key] = (items[key] || 0) + 1;
    return items;
  }, {});

  return {
    totalGoals: totals.goals,
    assists: totals.assists,
    recoveries: totals.recoveries,
    avgRating,
    playerMatches: totals.matches,
    finishedMatches: finished.length,
    wins,
    draws,
    losses,
    winRate,
    hasFinishedMatches: finished.length > 0,
    hasRatings: playersWithRating.length > 0,
    hasProductionStats: totals.goals + totals.assists + totals.recoveries > 0,
    positionCounts,
  };
}

function calculatePlayerOverall(player) {
  const stats = player?.stats || {};
  const rating = Number(stats.rating || 0);
  const matches = Number(stats.matches || 0);
  const goals = Number(stats.goals || 0);
  const assists = Number(stats.assists || 0);
  const recoveries = Number(stats.recoveries || 0);
  const wins = Number(stats.wins || 0);
  const consistency = matches ? Math.min((matches / 25) * 14, 14) : 0;
  const production = Math.min((goals + assists) * 1.6, 20);
  const defense = Math.min((recoveries + Number(stats.tackles || 0) + Number(stats.interceptions || 0)) * 0.5, 12);
  const winImpact = matches ? Math.min((wins / matches) * 10, 10) : 0;
  const ratingScore = Math.min(rating * 4.3, 43);
  return Math.max(1, Math.min(99, Math.round(1 + ratingScore + consistency + production + defense + winImpact)));
}

function localAchievementPreview(player) {
  const stats = player?.stats || {};
  return [
    Number(stats.goals || 0) >= 1 && 'Primeiro gol',
    Number(stats.assists || 0) >= 1 && 'Primeira assistencia',
    Number(stats.matches || 0) >= 10 && '10 partidas',
    Number(stats.matches || 0) >= 25 && '25 partidas',
    Number(stats.rating || 0) >= 9 && 'Nota acima de 9',
    Number(stats.recoveries || 0) + Number(stats.tackles || 0) + Number(stats.interceptions || 0) >= 25 && 'Muralha defensiva',
  ].filter(Boolean);
}

function TeamInsights({ stats, players, setView }) {
  const positionEntries = Object.entries(stats.positionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const positionLabels = positionEntries.map(([position]) => position);
  const positionValues = positionEntries.map(([, amount]) => amount);

  return (
    <div className="dashboard-analytics">
      <article className="panel analytics-card">
        <div className="dashboard-panel-head">
          <div>
            <span>Forma</span>
            <h3>Resumo competitivo</h3>
          </div>
          <button className="action-link" type="button" onClick={() => setView('matches')}>
            Partidas
          </button>
        </div>
        {stats.hasFinishedMatches ? (
          <ApexChart
            className="chart-box small"
            options={{
            chart: { type: 'radialBar', sparkline: { enabled: true } },
            series: [stats.winRate],
            labels: ['Vitorias'],
            colors: ['#d4a24c'],
            plotOptions: {
              radialBar: {
                hollow: {
                  size: '66%',
                  background: 'rgba(8, 11, 18, 0.92)',
                },
                track: {
                  background: 'rgba(148, 163, 184, 0.14)',
                  strokeWidth: '100%',
                },
                dataLabels: {
                  name: {
                    show: true,
                    offsetY: 18,
                    color: '#99a4b8',
                    fontFamily: 'Oxanium, Sora, system-ui, sans-serif',
                    fontSize: '11px',
                    fontWeight: 800,
                  },
                  value: {
                    show: true,
                    offsetY: -8,
                    color: '#fff7d6',
                    fontFamily: 'Oxanium, Sora, system-ui, sans-serif',
                    fontSize: '28px',
                    fontWeight: 800,
                    formatter: (value) => `${Math.round(value)}%`,
                  },
                },
              },
            },
            fill: {
              type: 'gradient',
              gradient: {
                shade: 'dark',
                type: 'horizontal',
                gradientToColors: ['#f59e0b'],
                stops: [0, 100],
              },
            },
            stroke: { lineCap: 'round' },
            tooltip: { enabled: true, theme: 'dark', y: { formatter: (value) => `${value}%` } },
            }}
          />
        ) : (
          <EmptyState icon={Flag} title="Sem partidas registradas" description="O resumo competitivo aparece apos resultados reais." />
        )}
        <div className="chart-legend">
          <span><i className="win" /> {stats.wins}V</span>
          <span><i className="draw" /> {stats.draws}E</span>
          <span><i className="loss" /> {stats.losses}D</span>
        </div>
      </article>

      <article className="panel analytics-card wide">
        <div className="dashboard-panel-head">
          <div>
            <span>Producao</span>
            <h3>Forca do elenco</h3>
          </div>
          <button className="action-link" type="button" onClick={() => setView('performance')}>
            Desempenho
          </button>
        </div>
        {stats.hasProductionStats ? (
          <ApexChart
            className="chart-box"
            options={makeApexBarOptions({
              categories: ['Gols', 'Assist.', 'Roubadas'],
              series: [{ name: 'Total', data: [stats.totalGoals, stats.assists, stats.recoveries] }],
              colors: ['#d4a24c'],
            })}
          />
        ) : (
          <EmptyState icon={BarChart3} title="Nenhuma estatistica registrada." description="As estatisticas do elenco aparecerao aqui apos serem cadastradas." />
        )}
      </article>

      <article className="panel analytics-card wide">
        <div className="dashboard-panel-head">
          <div>
            <span>Elenco</span>
            <h3>Posicoes</h3>
          </div>
          <button className="action-link" type="button" onClick={() => setView('players')}>
            Jogadores
          </button>
        </div>
        <div className="position-chart">
          {!!positionEntries.length && (
            <ApexChart
              className="chart-box"
              options={makeApexBarOptions({
                categories: positionLabels,
                series: [{ name: 'Jogadores', data: positionValues }],
                horizontal: true,
                colors: ['#f6c768'],
              })}
            />
          )}
          {!players.length && <EmptyState icon={Users} title="Sem jogadores" />}
        </div>
      </article>
    </div>
  );
}

function ActivityFeed({ activities, setView, setSelectedPlayerId }) {
  return (
    <article className="panel dashboard-panel activity-feed">
      <div className="dashboard-panel-head">
        <div>
          <span>Clube</span>
          <h3>Atividades recentes</h3>
        </div>
        <button className="action-link" type="button" onClick={() => setView('notifications')}>
          Notificacoes
        </button>
      </div>
      <div className="dashboard-list">
        {activities.slice(0, 6).map((activity) => (
          <button
            className="dashboard-list-row activity-row"
            type="button"
            key={activity.id}
            onClick={() => {
              if (activity.relatedEntityType === 'player' && activity.relatedEntityId) {
                setSelectedPlayerId?.(activity.relatedEntityId);
                setView('player-detail');
                return;
              }
              const target = String(activity.actionUrl || '').replace('/', '');
              if (target) setView(target);
            }}
          >
            <div className={`icon-tile ${activity.type.includes('achievement') ? 'gold' : 'blue'}`}>
              {activity.type.includes('achievement') ? <Trophy size={16} /> : <Activity size={16} />}
            </div>
            <div>
              <strong>{activity.message}</strong>
              <span>{formatDateTime(activity.createdAt)}</span>
            </div>
          </button>
        ))}
        {activities.length === 0 && (
          <EmptyState icon={Activity} title="Nenhuma atividade registrada." description="Eventos reais do clube aparecerao aqui quando forem salvos no backend." />
        )}
      </div>
    </article>
  );
}

function makeApexBarOptions({ categories, series, horizontal = false, colors = ['#d4a24c'] }) {
  return {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 650 },
      foreColor: '#99a4b8',
      fontFamily: 'Oxanium, Sora, system-ui, sans-serif',
    },
    series,
    colors,
    plotOptions: {
      bar: {
        horizontal,
        borderRadius: 8,
        columnWidth: '48%',
        barHeight: '58%',
        distributed: !horizontal,
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: horizontal ? 'horizontal' : 'vertical',
        shadeIntensity: 0.2,
        gradientToColors: horizontal ? ['#d4a24c'] : ['#f59e0b', '#d4a24c', '#60a5fa'],
        opacityFrom: 0.98,
        opacityTo: 0.72,
        stops: [0, 100],
      },
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: 'rgba(148, 163, 184, 0.08)',
      strokeDashArray: 4,
      padding: horizontal
        ? { top: -6, right: 4, bottom: -8, left: 34 }
        : { top: -6, right: 8, bottom: -8, left: 2 },
    },
    xaxis: {
      categories,
      tickAmount: 3,
      labels: {
        trim: false,
        style: {
          colors: '#aeb8ca',
          fontFamily: 'Oxanium, Sora, system-ui, sans-serif',
          fontSize: '11px',
          fontWeight: 700,
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        minWidth: horizontal ? 106 : 0,
        maxWidth: horizontal ? 128 : 44,
        trim: false,
        formatter: (value) => value,
        style: {
          colors: '#aeb8ca',
          fontFamily: 'Oxanium, Sora, system-ui, sans-serif',
          fontSize: '10px',
          fontWeight: 700,
        },
      },
    },
    tooltip: {
      theme: 'dark',
      y: { formatter: (value) => `${value}` },
    },
    legend: { show: false },
  };
}

function ApexChart({ options, className = '' }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return undefined;

    let chart;
    let active = true;

    import('apexcharts').then(({ default: ApexCharts }) => {
      if (!active || !chartRef.current) return;

      const height = chartRef.current.clientHeight || 150;
      chart = new ApexCharts(chartRef.current, {
        ...options,
        chart: {
          background: 'transparent',
          ...options.chart,
          height,
          width: '100%',
        },
      });
      chart.render();
    });

    return () => {
      active = false;
      chart?.destroy();
    };
  }, [options]);

  return (
    <div className={className}>
      <div ref={chartRef} className="apex-chart" aria-label="Grafico do painel" role="img" />
    </div>
  );
}

function Profile({ user, setUser, setUsers, players, setPlayers, setView, notify, refreshClubData }) {
  const linkedPlayer = findPlayerForUser(user, players);
  const base = linkedPlayer || {
    id: null,
    fullName: user.name || 'Membro Torinno FC',
    nickname: user.nickname || user.name || 'Membro',
    position: user.position || 'Sem posicao',
    shirt: user.shirt || 0,
    bio: '',
    status: 'Sem jogador',
    photo: user.photo || '',
  };
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name || base.fullName,
    nickname: user.nickname || base.nickname,
    position: user.position || base.position,
    shirt: user.shirt || base.shirt,
    bio: base.bio,
    photo: user.photo || base.photo || '',
  });
  const profilePhoto = form.photo || user.photo || base.photo || '';
  const username = `@${(form.name || form.nickname).replace(/\s+/g, '_')}`;
  const statusLabel = base.status === 'Ativo' ? 'Contratado' : base.status || 'Contratado';
  const [teamInfo, setTeamInfo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('torinnofc-team')) || { name: 'Torinno FC', code: '83987726302' };
    } catch {
      return { name: 'Torinno FC', code: '83987726302' };
    }
  });
  const [editingTeam, setEditingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState(teamInfo || { name: '', code: '' });

  useEffect(() => {
    if (teamInfo) {
      localStorage.setItem('torinnofc-team', JSON.stringify(teamInfo));
    } else {
      localStorage.removeItem('torinnofc-team');
    }
  }, [teamInfo]);

  const handleProfilePhotoChange = async (file) => {
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      notify('Use uma foto PNG, JPG, JPEG ou WEBP.');
      return;
    }

    if (file.size > maxSize) {
      notify('A foto deve ter no maximo 5MB.');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm({ ...form, photo: dataUrl });
      notify('Foto carregada. Salve o perfil para manter a alteracao.');
    } catch {
      notify('Nao foi possivel carregar a foto.');
    }
  };

  return (
    <section className="profile-layout">
      <div className="panel profile-summary-card">
        <div className={`avatar profile-avatar ${profilePhoto ? 'has-photo' : ''}`}>
          {profilePhoto ? <img src={profilePhoto} alt="" /> : getInitials(form.nickname)}
        </div>
        <div className="profile-summary-copy">
          <h2>{form.nickname}</h2>
          <span>{form.position} | {user.staffRole || roleLabel(user.role)}</span>
          {user.email && <small>{user.email}</small>}
        </div>
        <button className="button secondary" type="button" onClick={() => setEditing(!editing)}>
          <Edit3 size={16} />
          Editar perfil
        </button>
      </div>

      {editing && (
        <div className="panel profile-edit-panel">
          <div className="profile-photo-editor">
            <label className="profile-photo-picker" aria-label="Adicionar foto de perfil">
              <span className={`avatar profile-avatar ${profilePhoto ? 'has-photo' : ''}`}>
                {profilePhoto ? <img src={profilePhoto} alt="" /> : getInitials(form.nickname)}
              </span>
              <span className="profile-photo-plus">
                <Plus size={15} />
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                capture="environment"
                onChange={(event) => handleProfilePhotoChange(event.target.files?.[0])}
              />
            </label>
            <div className="profile-photo-copy">
              <strong>Foto de perfil</strong>
            </div>
            {profilePhoto && (
              <button className="button minimal danger" type="button" onClick={() => setForm({ ...form, photo: '' })}>
                Remover foto
              </button>
            )}
          </div>
          <div className="form-grid">
            <Field label="Nome completo" value={form.name} onChange={(name) => setForm({ ...form, name })} />
            <Field label="Apelido" value={form.nickname} onChange={(nickname) => setForm({ ...form, nickname })} />
            <label className="field">
              <span>Posicao</span>
              <select value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })}>
                {positions.map((position) => (
                  <option key={position}>{position}</option>
                ))}
              </select>
            </label>
            <Field label="Camisa" type="number" value={form.shirt} onChange={(shirt) => setForm({ ...form, shirt })} />
          </div>
          <label className="field">
            <span>Bio curta</span>
            <textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
          </label>
          <button
            className="button primary"
            type="button"
            onClick={async () => {
              if (!form.name.trim() || !form.nickname.trim()) {
                notify('Preencha nome completo e apelido.');
                return;
              }

              if (!isValidShirtNumber(form.shirt)) {
                notify('Digite uma camisa valida entre 1 e 999.');
                return;
              }

              const nextUser = {
                ...user,
                name: form.name.trim(),
                nickname: form.nickname.trim(),
                position: form.position,
                shirt: form.shirt,
                bio: form.bio.trim(),
                photo: form.photo,
                profileUpdate: true,
              };

              if (hasSupabaseConfig) {
                try {
                  const { error } = await supabase.auth.updateUser({
                    data: {
                      name: nextUser.name,
                      nickname: nextUser.nickname,
                      position: nextUser.position,
                      shirt: nextUser.shirt,
                      bio: nextUser.bio,
                      photo: nextUser.photo,
                    },
                  });
                  if (error) throw error;
                } catch {
                  notify('Nao foi possivel atualizar os metadados de autenticacao.');
                }
              }

              try {
                const synced = await apiSyncUser(nextUser);
                const savedUser = normalizeUser({
                  ...nextUser,
                  id: synced.id,
                  backendId: synced.id,
                  role: synced.role,
                  staffRole: synced.staffRole,
                  playerId: synced.playerId,
                  hasPlayerProfile: Boolean(synced.playerId),
                });
                setUser(publicUser(savedUser));
                setUsers((items) => items.some((item) => item.email?.toLowerCase() === savedUser.email.toLowerCase())
                  ? items.map((item) => (item.email?.toLowerCase() === savedUser.email.toLowerCase() ? savedUser : item))
                  : [...items, savedUser]);
                if (synced.player) {
                  const normalizedPlayer = normalizePlayer(synced.player);
                  setPlayers((items) => items.some((player) => player.id === normalizedPlayer.id)
                    ? items.map((player) => (player.id === normalizedPlayer.id ? normalizedPlayer : player))
                    : [normalizedPlayer, ...items]);
                }
                await refreshClubData?.({ silent: true });
                setEditing(false);
                notify('Perfil salvo e sincronizado com o elenco.');
              } catch (error) {
                notify(error.message || 'Nao foi possivel salvar o perfil no banco.');
              }
            }}
          >
            <Save size={16} />
            Salvar perfil
          </button>
        </div>
      )}

      <div className="panel profile-card player-profile-card">
        <div className="profile-card-head">
          <div>
            <User size={18} />
            <h3>Perfil do Jogador</h3>
          </div>
          <button className="button minimal" type="button" onClick={() => setEditing(true)}>
            <Edit3 size={15} />
            Editar
          </button>
        </div>
        <div className="profile-player-body">
          <div className={`avatar profile-player-avatar ${profilePhoto ? 'has-photo' : ''}`}>
            {profilePhoto ? <img src={profilePhoto} alt="" /> : getInitials(form.nickname)}
          </div>
          <div className="profile-player-main">
            <h4>{form.name}</h4>
            <span>{username}</span>
            <div className="profile-info-grid">
              <div>
                <small>Posicao</small>
                <strong>{form.position}</strong>
              </div>
              <div>
                <small>Camisa</small>
                <strong>#{form.shirt}</strong>
              </div>
              <div>
                <small>Status</small>
                <b className="profile-badge blue">{statusLabel}</b>
              </div>
              <div>
                <small>Bio</small>
                <strong>{form.bio || 'Camisa 10 e capitao'}</strong>
              </div>
            </div>
          </div>
        </div>
        <button className="profile-action-row" type="button" onClick={() => setView('performance')}>
          <span>Ver Meu Jogador (estatisticas)</span>
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="panel profile-card team-profile-card">
        <div className="profile-card-head">
          <div>
            <Shield size={18} />
            <h3>Meu Time</h3>
          </div>
          <div className="profile-card-actions">
            <button
              className="button minimal danger"
              type="button"
              onClick={() => {
                setTeamInfo(null);
                setEditingTeam(false);
                notify('Time desvinculado do perfil.');
              }}
            >
              <Trash2 size={15} />
              Excluir
            </button>
            <button
              className="button minimal"
              type="button"
              onClick={() => {
                setTeamForm(teamInfo || { name: '', code: '' });
                setEditingTeam(!editingTeam);
              }}
            >
              <Edit3 size={15} />
              Editar
            </button>
          </div>
        </div>
        {teamInfo ? (
          <div className="team-profile-body">
            <img src={logo} alt="" />
            <div>
              <h4>{teamInfo.name}</h4>
              <span>{teamInfo.code}</span>
            </div>
          </div>
        ) : (
          <div className="empty-state">Nenhum time vinculado ao perfil.</div>
        )}
        {editingTeam && (
          <div className="form-grid">
            <Field label="Nome do time" value={teamForm.name} onChange={(name) => setTeamForm({ ...teamForm, name })} />
            <Field label="ID/codigo" value={teamForm.code} onChange={(code) => setTeamForm({ ...teamForm, code })} />
            <button
              className="button primary full"
              type="button"
              onClick={() => {
                if (!teamForm.name.trim() || !teamForm.code.trim()) {
                  notify('Preencha nome e codigo do time.');
                  return;
                }
                setTeamInfo({ name: teamForm.name.trim(), code: teamForm.code.trim() });
                setEditingTeam(false);
                notify('Time atualizado.');
              }}
            >
              <Save size={15} />
              Salvar time
            </button>
          </div>
        )}
        <button className="profile-action-row" type="button" onClick={() => setView('team')}>
          <span>Gerenciar Meu Time</span>
          <ChevronRight size={17} />
        </button>
      </div>
    </section>
  );
}

function emptyPerformanceForm(matchId = '') {
  return {
    matchId,
    goals: 0,
    assists: 0,
    recoveries: 0,
    shots: 0,
    passes: 0,
    tackles: 0,
    interceptions: 0,
    minutes: 90,
    yellow: 0,
    red: 0,
    rating: 0,
    notes: '',
  };
}

function Performance({ user, players, setPlayers, matches, notify, refreshClubData }) {
  const linkedPlayer = findPlayerForUser(user, players);
  const [player, setPlayer] = useState(linkedPlayer);
  const [performances, setPerformances] = useState([]);
  const [form, setForm] = useState(() => emptyPerformanceForm(matches[0]?.id || ''));
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchMyPerformance()
      .then((payload) => {
        if (!active) return;
        const normalizedPlayer = payload.player ? normalizePlayer(payload.player) : linkedPlayer;
        setPlayer(normalizedPlayer || null);
        setPerformances(payload.performances || []);
        if (normalizedPlayer) {
          setPlayers((items) => {
            const exists = items.some((item) => item.id === normalizedPlayer.id);
            return exists
              ? items.map((item) => (item.id === normalizedPlayer.id ? normalizedPlayer : item))
              : [normalizedPlayer, ...items];
          });
        }
        setError('');
      })
      .catch((apiError) => setError(apiError.message || 'Nao foi possivel carregar seu desempenho.'))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user.id]);

  const availableMatches = matches.filter((match) => match.status !== 'Cancelada');
  const selectedMatch = availableMatches.find((match) => match.id === form.matchId);
  const stats = player?.stats || {};

  const updateNumber = (key, value) => {
    setForm((current) => ({ ...current, [key]: value === '' ? '' : Number(value) }));
  };

  const validateForm = () => {
    if (!form.matchId && !editingId) return 'Selecione uma partida cadastrada.';
    const numericKeys = ['goals', 'assists', 'recoveries', 'shots', 'passes', 'tackles', 'interceptions', 'minutes', 'yellow', 'red'];
    if (numericKeys.some((key) => !Number.isInteger(Number(form[key])) || Number(form[key]) < 0)) {
      return 'Use apenas numeros inteiros nao negativos.';
    }
    if (!Number.isFinite(Number(form.rating)) || Number(form.rating) < 0 || Number(form.rating) > 10) {
      return 'A nota deve ficar entre 0 e 10.';
    }
    return '';
  };

  const reloadPerformance = async () => {
    const payload = await fetchMyPerformance();
    const normalizedPlayer = payload.player ? normalizePlayer(payload.player) : null;
    setPlayer(normalizedPlayer);
    setPerformances(payload.performances || []);
    if (normalizedPlayer) {
      setPlayers((items) => items.map((item) => (item.id === normalizedPlayer.id ? normalizedPlayer : item)));
    }
  };

  const submit = async () => {
    const validation = validateForm();
    if (validation) {
      notify(validation);
      return;
    }

    setSaving(true);
    try {
      const payload = editingId
        ? await apiUpdateMyPerformance(editingId, form)
        : await apiCreateMyPerformance(form);
      const normalizedPlayer = normalizePlayer(payload.player);
      setPlayer(normalizedPlayer);
      setPlayers((items) => items.map((item) => (item.id === normalizedPlayer.id ? normalizedPlayer : item)));
      await reloadPerformance();
      await refreshClubData?.({ silent: true });
      setForm(emptyPerformanceForm(availableMatches[0]?.id || ''));
      setEditingId('');
      notify('Desempenho salvo no banco.');
    } catch (apiError) {
      notify(apiError.message || 'Nao foi possivel salvar o desempenho.');
    } finally {
      setSaving(false);
    }
  };

  const editPerformance = (item) => {
    setEditingId(item.id);
    setForm({
      matchId: item.matchId,
      goals: item.goals,
      assists: item.assists,
      recoveries: item.recoveries,
      shots: item.shots,
      passes: item.passes,
      tackles: item.tackles,
      interceptions: item.interceptions,
      minutes: item.minutes,
      yellow: item.yellow,
      red: item.red,
      rating: item.rating,
      notes: item.notes,
    });
  };

  const removePerformance = async (item) => {
    if (!window.confirm('Excluir este desempenho?')) return;
    setSaving(true);
    try {
      await apiDeleteMyPerformance(item.id);
      await reloadPerformance();
      await refreshClubData?.({ silent: true });
      notify('Desempenho excluido.');
    } catch (apiError) {
      notify(apiError.message || 'Nao foi possivel excluir o desempenho.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section>
        <SectionHeader eyebrow="Controle pessoal" title="Meu Desempenho" />
        <div className="panel performance-panel">Carregando desempenho...</div>
      </section>
    );
  }

  if (!player) {
    return (
      <section>
        <SectionHeader eyebrow="Controle pessoal" title="Meu Desempenho" />
        <EmptyState icon={Activity} title="Nenhum jogador vinculado ao seu perfil." description={error || 'Entre novamente para sincronizar seu cadastro de jogador com o elenco.'} />
      </section>
    );
  }

  return (
    <section>
      <SectionHeader eyebrow="Controle pessoal" title="Meu Desempenho" />
      <div className="panel performance-player-card">
        <div className="avatar">{player.avatar}</div>
        <div className="performance-player-copy">
          <strong>{player.nickname}</strong>
          <span>{player.position} | Camisa {player.shirt} | {user.staffRole || roleLabel(user.role)}</span>
          <small>{stats.matches || 0} partidas registradas</small>
        </div>
        <div className="performance-actions">
          <button className="button secondary" type="button" onClick={() => downloadPerformanceReport({ format: 'pdf' }).catch((apiError) => notify(apiError.message))}>
            <BarChart3 size={16} />
            PDF
          </button>
          <button className="button secondary" type="button" onClick={() => downloadPerformanceReport({ format: 'csv' }).catch((apiError) => notify(apiError.message))}>
            <BarChart3 size={16} />
            CSV
          </button>
        </div>
      </div>

      <div className="dashboard-metrics">
        <StatCard icon={Flag} value={stats.matches || 0} label="Partidas" />
        <StatCard icon={Trophy} value={stats.goals || 0} label="Gols" />
        <StatCard icon={Users} value={stats.assists || 0} label="Assistencias" />
        <StatCard icon={Activity} value={stats.recoveries || 0} label="Roubadas" />
        <StatCard icon={BarChart3} value={stats.shots || 0} label="Finalizacoes" />
        <StatCard icon={CheckCircle2} value={stats.passes || 0} label="Passes certos" />
        <StatCard icon={Shield} value={stats.tackles || 0} label="Desarmes" />
        <StatCard icon={Eye} value={stats.interceptions || 0} label="Interceptacoes" />
        <StatCard icon={Star} value={stats.rating || 0} label="Nota media" />
        <StatCard icon={Sparkles} value={(stats.goals || 0) + (stats.assists || 0)} label="Participacoes" />
      </div>

      <div className="panel performance-panel">
        <h3>{editingId ? 'Editar desempenho da partida' : 'Registrar desempenho da partida'}</h3>
        {availableMatches.length === 0 && (
          <div className="settings-warning">Nenhuma partida cadastrada. Cadastre uma partida para registrar desempenho.</div>
        )}
        <label className="field">
          <span>Partida</span>
          <select value={form.matchId} disabled={Boolean(editingId) || saving} onChange={(event) => setForm({ ...form, matchId: event.target.value })}>
            <option value="">Selecione</option>
            {availableMatches.map((match) => (
              <option value={match.id} key={match.id}>{match.dateKey} | {match.away} | {match.score}</option>
            ))}
          </select>
        </label>
        {selectedMatch && <div className="settings-warning">Adversario: {selectedMatch.away} | Data: {selectedMatch.dateKey} | Resultado: {selectedMatch.score}</div>}
        <div className="form-grid three performance-grid">
          {[
            ['goals', 'Gols'],
            ['assists', 'Assistencias'],
            ['recoveries', 'Roubadas'],
            ['shots', 'Finalizacoes'],
            ['passes', 'Passes certos'],
            ['tackles', 'Desarmes'],
            ['interceptions', 'Interceptacoes'],
            ['minutes', 'Minutos'],
            ['yellow', 'Cartao amarelo'],
            ['red', 'Cartao vermelho'],
            ['rating', 'Nota'],
          ].map(([key, label]) => (
            <Field key={key} label={label} type="number" value={form[key]} onChange={(value) => updateNumber(key, value)} />
          ))}
        </div>
        <label className="field performance-notes">
          <span>Observacoes</span>
          <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
        </label>
        <div className="performance-actions">
          <button className="button primary" type="button" disabled={saving || availableMatches.length === 0} onClick={submit}>
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar desempenho'}
          </button>
          {editingId && (
            <button className="button secondary" type="button" disabled={saving} onClick={() => {
              setEditingId('');
              setForm(emptyPerformanceForm(availableMatches[0]?.id || ''));
            }}>
              Cancelar edicao
            </button>
          )}
        </div>
      </div>

      <div className="panel performance-panel">
        <h3>Historico por partida</h3>
        {performances.length === 0 ? (
          <EmptyState icon={Activity} title="Nenhum desempenho registrado." description="Cadastre o desempenho de uma partida para visualizar as estatisticas." />
        ) : (
          <div className="performance-history">
            {performances.map((item) => (
              <article className="performance-history-row" key={item.id}>
                <div>
                  <strong>{item.match?.away || 'Partida'}</strong>
                  <span>{item.match?.dateKey || ''} | {item.match?.score || '-'}</span>
                </div>
                <small>G {item.goals} | A {item.assists} | R {item.recoveries} | Nota {item.rating}</small>
                <div className="performance-actions">
                  <button className="button minimal small" type="button" onClick={() => editPerformance(item)}>Editar</button>
                  <button className="button minimal small danger" type="button" disabled={saving} onClick={() => removePerformance(item)}>Excluir</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="panel performance-panel">
        <h3>Evolucao real</h3>
        {performances.length === 0 ? (
          <p className="settings-warning">Nenhum desempenho registrado.</p>
        ) : (
          <div className="performance-bars">
            {performances.slice().reverse().slice(-8).map((item) => (
              <div className="performance-bar" key={item.id}>
                <span>{item.match?.away || 'Jogo'}</span>
                <div><i style={{ width: `${Math.max(4, item.rating * 10)}%` }} /></div>
                <small>{item.rating}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Players({ players, setView, setSelectedPlayerId }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Todos');
  const filtered = players.filter((player) => {
    const matchQuery = `${player.fullName} ${player.nickname}`.toLowerCase().includes(query.toLowerCase());
    const matchFilter = filter === 'Todos' || player.position === filter;
    return matchQuery && matchFilter;
  });

  return (
    <section>
      <SectionHeader eyebrow="Elenco" title="Jogadores cadastrados" />
      <div className="toolbar">
        <label className="search">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar jogador" />
        </label>
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option>Todos</option>
          {positions.map((position) => (
            <option key={position}>{position}</option>
          ))}
        </select>
      </div>
      <div className="player-grid">
        {filtered.map((player) => (
          <article className="player-card" key={player.id}>
            <div className="avatar">{player.avatar}</div>
            <div>
              <strong>{player.nickname}</strong>
              <span>{player.fullName}</span>
            </div>
            <div className="player-meta">
              <b>#{player.shirt}</b>
              <small>{player.position}</small>
            </div>
            <button
              className="button minimal"
              type="button"
              onClick={() => {
                setSelectedPlayerId(player.id);
                setView('player-detail');
              }}
            >
              Ver perfil
            </button>
          </article>
        ))}
        {filtered.length === 0 && <div className="empty-state">{players.length === 0 ? 'Nenhum jogador cadastrado no elenco.' : 'Nenhum jogador encontrado.'}</div>}
      </div>
    </section>
  );
}

function Tryouts({ user, tryouts, setTryouts, notify, refreshClubData }) {
  const [form, setForm] = useState({
    players: [{ id: 'candidate-1', name: '', position: 'Atacante' }],
    age: '',
    contact: '',
    date: toDateKey(addDays(new Date(), 1)),
    time: '18:00',
    place: 'EA FC 26 | Clubs',
    requirements: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const canManage = Boolean(user);

  const updateCandidate = (id, patch) => {
    setForm((current) => ({
      ...current,
      players: current.players.map((player) => (player.id === id ? { ...player, ...patch } : player)),
    }));
  };

  const addCandidate = () => {
    setForm((current) => ({
      ...current,
      players: [
        ...current.players,
        { id: `candidate-${Date.now()}`, name: '', position: 'Atacante' },
      ],
    }));
  };

  const removeCandidate = (id) => {
    setForm((current) => ({
      ...current,
      players: current.players.length <= 1
        ? current.players
        : current.players.filter((player) => player.id !== id),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!canManage) {
      notify('Voce nao possui permissao para agendar peneiras.');
      return;
    }
    const candidates = normalizeTryoutPlayers(form.players);
    if (candidates.length === 0 || !form.date || !form.time) {
      notify('Preencha pelo menos um jogador, data e horario da peneira.');
      return;
    }

    const tryout = {
      id: `local-tryout-${Date.now()}`,
      ...form,
      fullName: summarizeTryoutPlayers(candidates),
      players: candidates,
      position: [...new Set(candidates.map((player) => player.position))].join(', '),
      age: Number(form.age) || '',
      status: 'Agendada',
      requirements: form.requirements,
    };
    let normalized;

    setSaving(true);
    try {
      const saved = await apiCreateTryout(tryout);
      normalized = normalizeTryout(saved);
      setTryouts((items) => mergeById(normalizeTryout, [normalized], items));
      await refreshClubData?.({ silent: true });
      notify('Peneira agendada e salva no banco.');
    } catch (error) {
      notify(error.message || 'Nao foi possivel criar a peneira.');
      return;
    } finally {
      setSaving(false);
    }

    setForm({
      players: [{ id: 'candidate-1', name: '', position: 'Atacante' }],
      age: '',
      contact: '',
      date: toDateKey(addDays(new Date(), 1)),
      time: '18:00',
      place: 'EA FC 26 | Clubs',
      requirements: '',
      notes: '',
    });
  };

  const updateStatus = async (id, status) => {
    try {
      const saved = String(id).startsWith('local-')
        ? { ...tryouts.find((tryout) => tryout.id === id), status }
        : await apiUpdateTryoutStatus(id, status);
      setTryouts(tryouts.map((tryout) => (tryout.id === id ? normalizeTryout(saved) : tryout)));
      await refreshClubData?.({ silent: true });
      notify(`Teste marcado como ${status.toLowerCase()}.`);
    } catch (error) {
      notify(error.message || 'Nao foi possivel atualizar a peneira.');
    }
  };

  const removeTryout = async (id) => {
    try {
      if (!String(id).startsWith('local-')) {
        await apiDeleteTryout(id);
      }
      setTryouts(tryouts.filter((item) => item.id !== id));
      await refreshClubData?.({ silent: true });
      notify('Teste removido.');
    } catch (error) {
      notify(error.message || 'Nao foi possivel remover a peneira.');
    }
  };

  return (
    <section>
      <SectionHeader eyebrow="EA Sports FC | Pro Clubs" title={canManage ? 'Nova peneira' : 'Peneiras'} />
      <div className="tryout-layout">
        {canManage ? (
          <form className="panel tryout-form" onSubmit={submit}>
            <h3>Nova peneira no EA FC</h3>
            <div className="tryout-candidates">
              {form.players.map((candidate, index) => (
                <div className="tryout-candidate-row" key={candidate.id}>
                  <Field label={`Jogador ${index + 1}`} value={candidate.name} onChange={(name) => updateCandidate(candidate.id, { name })} />
                  <label className="field">
                    <span>Posicao</span>
                    <select value={candidate.position} onChange={(event) => updateCandidate(candidate.id, { position: event.target.value })}>
                      {gamePositions.map((position) => (
                        <option key={position}>{position}</option>
                      ))}
                    </select>
                  </label>
                  <button className="button minimal danger" type="button" disabled={form.players.length <= 1} onClick={() => removeCandidate(candidate.id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button className="button secondary" type="button" onClick={addCandidate}>
                <Plus size={16} />
                Adicionar jogador
              </button>
            </div>
            <div className="form-grid">
              <Field label="OVR minimo" type="number" value={form.age} onChange={(age) => setForm({ ...form, age })} />
              <Field label="Contato / Discord" value={form.contact} onChange={(contact) => setForm({ ...form, contact })} />
            </div>
            <div className="form-grid three">
              <Field label="Data" type="date" value={form.date} onChange={(date) => setForm({ ...form, date })} />
              <Field label="Horario" type="time" value={form.time} onChange={(time) => setForm({ ...form, time })} />
              <Field label="Plataforma / modo" value={form.place} onChange={(place) => setForm({ ...form, place })} />
            </div>
            <label className="field">
              <span>Requisitos</span>
              <textarea
                value={form.requirements}
                onChange={(event) => setForm({ ...form, requirements: event.target.value })}
                placeholder="Ex: headset, disponibilidade, estilo de jogo, overall minimo"
              />
            </label>
            <label className="field">
              <span>Observacoes</span>
              <textarea
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Ex: disponibilidade, estilo de jogo, headset, posicoes secundarias"
              />
            </label>
            <button className="button primary full" type="submit" disabled={saving}>
              <CalendarDays size={16} />
              {saving ? 'Salvando...' : 'Nova peneira'}
            </button>
          </form>
        ) : (
          <div className="panel tryout-info">
            <UserPlus size={24} />
            <div>
              <h3>Peneiras do clube</h3>
              <p>Acompanhe os testes agendados pelos administradores do TorinnoFC.</p>
            </div>
          </div>
        )}

        {tryouts.length > 0 && (
          <div className="tryout-stack">
          <div className="tryout-list">
            {tryouts.map((tryout) => (
              <article className="tryout-card" key={tryout.id}>
                <div className="avatar">{getInitials(tryout.fullName)}</div>
                <div>
                  <strong>{tryout.fullName}</strong>
                  <span>
                    {tryout.age ? `OVR ${tryout.age} | ` : ''}
                    {tryout.position}
                  </span>
                  {tryout.players?.length > 0 && (
                    <div className="tryout-player-list">
                      {tryout.players.map((player) => (
                        <small key={`${tryout.id}-${player.name}-${player.position}`}>{player.name} | {player.position}</small>
                      ))}
                    </div>
                  )}
                  <small>
                    {formatDateLabel(tryout.date)} as {tryout.time} | {tryout.place}
                  </small>
                  <small>{tryout.contact}</small>
                  {tryout.requirements && <em>{tryout.requirements}</em>}
                  {tryout.notes && <em>{tryout.notes}</em>}
                </div>
                {canManage && (
                  <div className="tryout-actions">
                    <button className="button minimal" type="button" onClick={() => openWhatsAppWithPreparedMessage(WHATSAPP_GROUP_INVITE_URL, buildTryoutWhatsAppMessage(tryout), notify)}>
                      Compartilhar no WhatsApp
                    </button>
                    <button className={`status ${tryout.status === 'Confirmada' ? 'live' : ''}`} type="button" onClick={() => updateStatus(tryout.id, tryout.status === 'Confirmada' ? 'Agendada' : 'Confirmada')}>
                      {tryout.status}
                    </button>
                    <button
                      className="button minimal danger"
                      type="button"
                      onClick={() => removeTryout(tryout.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
          </div>
        )}
      </div>
    </section>
  );
}

function MatchStatsRecorder({ match, players = [], setPlayers, notify, refreshClubData }) {
  const normalizedMatch = normalizeMatchEvent(match);
  const [playerId, setPlayerId] = useState(players[0]?.id || '');
  const [form, setForm] = useState({
    goals: 0,
    assists: 0,
    recoveries: 0,
    shots: 0,
    passes: 0,
    tackles: 0,
    interceptions: 0,
    yellow: 0,
    red: 0,
    minutes: 90,
    rating: 0,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!playerId && players[0]?.id) {
      setPlayerId(players[0].id);
    }
  }, [playerId, players]);

  const updateNumber = (key, value) => {
    setForm((current) => ({ ...current, [key]: value === '' ? '' : Number(value) }));
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!playerId) {
      notify('Selecione um jogador para registrar estatisticas.');
      return;
    }
    if (normalizedMatch.status !== 'Encerrada') {
      notify('Finalize a partida antes de registrar as estatisticas.');
      return;
    }
    if (!Number.isFinite(Number(form.rating)) || Number(form.rating) < 0 || Number(form.rating) > 10) {
      notify('A nota deve ficar entre 0 e 10.');
      return;
    }

    const payload = {
      ...form,
      matchId: normalizedMatch.id,
      rating: Number(form.rating) || 0,
      outcome: getScoreOutcome(normalizedMatch.score),
    };

    setSaving(true);
    try {
      const result = await apiCreatePlayerPerformance(playerId, payload);
      if (result.player) {
        setPlayers?.((items) => items.map((player) => (player.id === playerId ? normalizePlayer(result.player) : player)));
      }
      await refreshClubData?.({ silent: true });
      notify('Estatisticas da partida salvas e painel atualizado.');
    } catch {
      const previous = writeLocalMatchPerformance(normalizedMatch.id, playerId, payload);
      setPlayers?.((items) => items.map((player) => (
        player.id === playerId ? applyPerformanceDelta(player, payload, previous) : player
      )));
      notify('Estatisticas salvas localmente. O banco sincroniza quando voltar.');
    } finally {
      setSaving(false);
    }
  };

  if (normalizedMatch.status !== 'Encerrada') {
    return (
      <div className="settings-warning">Finalize a partida para liberar o registro de estatisticas.</div>
    );
  }

  return (
    <form className="match-stats-recorder" onSubmit={submit}>
      <div className="form-grid">
        <label className="field">
          <span>Jogador</span>
          <select value={playerId} onChange={(event) => setPlayerId(event.target.value)}>
            <option value="">Selecione</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>#{player.shirt} {player.nickname}</option>
            ))}
          </select>
        </label>
        <Field label="Nota" type="number" value={form.rating} onChange={(rating) => updateNumber('rating', rating)} />
      </div>
      <div className="form-grid three match-stats-grid">
        <Field label="Gols" type="number" value={form.goals} onChange={(goals) => updateNumber('goals', goals)} />
        <Field label="Assist." type="number" value={form.assists} onChange={(assists) => updateNumber('assists', assists)} />
        <Field label="Roubadas" type="number" value={form.recoveries} onChange={(recoveries) => updateNumber('recoveries', recoveries)} />
        <Field label="Finaliz." type="number" value={form.shots} onChange={(shots) => updateNumber('shots', shots)} />
        <Field label="Passes" type="number" value={form.passes} onChange={(passes) => updateNumber('passes', passes)} />
        <Field label="Desarmes" type="number" value={form.tackles} onChange={(tackles) => updateNumber('tackles', tackles)} />
        <Field label="Intercept." type="number" value={form.interceptions} onChange={(interceptions) => updateNumber('interceptions', interceptions)} />
        <Field label="Amarelos" type="number" value={form.yellow} onChange={(yellow) => updateNumber('yellow', yellow)} />
        <Field label="Vermelhos" type="number" value={form.red} onChange={(red) => updateNumber('red', red)} />
        <Field label="Minutos" type="number" value={form.minutes} onChange={(minutes) => updateNumber('minutes', minutes)} />
      </div>
      <label className="field">
        <span>Observacoes</span>
        <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
      </label>
      <button className="button primary" type="submit" disabled={saving || players.length === 0}>
        <Save size={16} />
        {saving ? 'Salvando...' : 'Salvar estatisticas'}
      </button>
    </form>
  );
}

function Matches({ user, players, setPlayers, matches, saveMatch, removeMatch, championships = [], notify, refreshClubData }) {
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const canCreate = Boolean(user);
  const canManage = canUser(user, 'editMatch') || canUser(user, 'deleteMatch');

  const handleSave = async (form, existingId) => {
    const match = normalizeMatchEvent({ ...form, home: 'TorinnoFC', date: formatDateLabel(form.dateKey), homeLogo: logo, score: form.score || '-' });
    if (!existingId && isDuplicateMatch(matches, match)) {
      notify('Essa partida ja existe nesse dia e horario.');
      return;
    }
    setSaving(true);
    try {
      await saveMatch(match, existingId);
      setModal(null);
      notify(existingId ? 'Partida atualizada.' : 'Partida cadastrada com sucesso.');
    } catch (error) {
      notify(error.message || 'Nao foi possivel salvar a partida.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta partida?')) return;
    setSaving(true);
    try {
      await removeMatch(id);
      setModal(null);
      notify('Partida removida.');
    } catch (error) {
      notify(error.message || 'Nao foi possivel excluir a partida.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="calendar-header">
        <SectionHeader eyebrow="Agenda competitiva" title="Partidas" />
        {canCreate && (
          <button
            className={`button ${modal?.type === 'new-match' ? 'secondary' : 'primary'}`}
            type="button"
            onClick={() => setModal(modal?.type === 'new-match' ? null : { type: 'new-match', dateKey: toDateKey(new Date()) })}
          >
            {modal?.type === 'new-match' ? <X size={16} /> : <Plus size={16} />}
            {modal?.type === 'new-match' ? 'Fechar formulario' : 'Nova partida'}
          </button>
        )}
      </div>
      {modal?.type === 'new-match' && (
        <MatchModal
          inline
          modal={modal}
          championships={championships}
          isAdmin={canManage}
          players={players}
          setPlayers={setPlayers}
          saving={saving}
          notify={notify}
          refreshClubData={refreshClubData}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onEdit={(match) => setModal({ type: 'edit-match', dateKey: match.dateKey, match })}
          onDelete={handleDelete}
        />
      )}
      <div className="match-list">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            user={user}
            match={match}
            players={players}
            setPlayers={setPlayers}
            saveMatch={saveMatch}
            notify={notify}
            refreshClubData={refreshClubData}
          />
        ))}
      </div>
      {modal && modal.type !== 'new-match' && (
        <MatchModal
          modal={modal}
          championships={championships}
          isAdmin={canManage}
          players={players}
          setPlayers={setPlayers}
          saving={saving}
          notify={notify}
          refreshClubData={refreshClubData}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onEdit={(match) => setModal({ type: 'edit-match', dateKey: match.dateKey, match })}
          onDelete={handleDelete}
        />
      )}
    </section>
  );
}

function Calendar({
  user,
  players,
  setPlayers,
  matches,
  saveMatch,
  removeMatch,
  tryouts = [],
  championships = [],
  notify,
  setView,
  refreshClubData,
}) {
  const [monthDate, setMonthDate] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(new Date()));
  const [filter, setFilter] = useState('Todos');
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const days = makeCalendarDays(monthDate);
  const monthTitle = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const calendarEvents = buildCalendarEvents(matches, tryouts);
  const selectedEvents = calendarEvents.filter((event) => event.dateKey === selectedDateKey);
  const visibleEvents = filter === 'Todos' ? calendarEvents : calendarEvents.filter((event) => getEventType(event) === filter);
  const selectedDateLabel = formatDateLabel(selectedDateKey);
  const canCreateMatch = Boolean(user);
  const canManageMatch = canUser(user, 'editMatch') || canUser(user, 'deleteMatch');

  const openForm = (dateKey, match = null) => {
    if (!canCreateMatch && !match) {
      notify('Voce nao possui permissao para criar partidas.');
      return;
    }
    setSelectedDateKey(dateKey);
    setModal({ type: match ? 'edit-match' : 'new-match', dateKey, match });
  };

  const handleSaveMatch = async (form, existingId) => {
    const match = normalizeMatchEvent({
      ...form,
      home: 'TorinnoFC',
      date: formatDateLabel(form.dateKey),
      homeLogo: logo,
      score: form.score || '-',
    });

    if (!existingId && isDuplicateMatch(matches, match)) {
      notify('Essa partida ja existe nesse dia e horario.');
      return;
    }

    setSaving(true);
    try {
      await saveMatch(match, existingId);
      setSelectedDateKey(match.dateKey);
      setModal(null);
      notify(existingId ? 'Partida atualizada.' : 'Partida cadastrada com sucesso.');
    } catch (error) {
      notify(error.message || 'Nao foi possivel salvar a partida.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('Excluir esta partida do calendario?')) return;

    setSaving(true);
    try {
      await removeMatch(matchId);
      setModal(null);
      notify('Partida removida do calendario.');
    } catch (error) {
      notify(error.message || 'Nao foi possivel excluir a partida.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="calendar-header">
        <div>
          <SectionHeader eyebrow="Calendario" title={monthTitle} />
          <p>Calendario de partidas e eventos do clube.</p>
        </div>
        <div className="calendar-controls">
          <button className="button minimal" type="button" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}>
            <ChevronLeft size={15} />
            Anterior
          </button>
          <button
            className="button primary"
            type="button"
            onClick={() => {
              const today = new Date();
              setMonthDate(today);
              setSelectedDateKey(toDateKey(today));
            }}
          >
            Hoje
          </button>
          <button className="button minimal" type="button" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}>
            Proximo
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
      <div className="calendar-toolbar">
        <div className="calendar-legend">
          {['Partida', 'Treino', 'Peneira', 'Interno'].map((type) => (
            <span className={`legend-chip ${type.toLowerCase()}`} key={type}>
              <i />
              {type}
            </span>
          ))}
        </div>
        <div className="calendar-filters">
          {['Todos', 'Partida', 'Treino', 'Peneira', 'Interno'].map((type) => (
            <button className={filter === type ? 'active' : ''} key={type} type="button" onClick={() => setFilter(type)}>
              {type}
            </button>
          ))}
        </div>
      </div>
      <div className="calendar-weekdays">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-month">
        {days.map((day) => {
          const dayEvents = visibleEvents.filter((event) => event.dateKey === day.key);
          const hasEvents = dayEvents.length > 0;
          const isSelected = selectedDateKey === day.key;
          return (
            <button
              className={`${day.currentMonth ? '' : 'muted'} ${day.today ? 'today' : ''} ${hasEvents ? 'has-events' : ''} ${isSelected ? 'selected' : ''}`}
              key={day.key}
              type="button"
              onClick={() => {
                setSelectedDateKey(day.key);
              }}
            >
              <span className="day-number">
                {day.day}
                {day.today && <em>Hoje</em>}
              </span>
              {dayEvents.slice(0, 2).map((event) => (
                <span className={`calendar-event ${getEventType(event).toLowerCase()}`} key={event.calendarId}>
                  {event.logo ? <img src={event.logo} alt="" /> : <b>{getInitials(event.title)}</b>}
                  <small>
                    <strong>{event.time}</strong>
                    {event.source === 'match' ? event.away : 'Peneira'}
                  </small>
                </span>
              ))}
              {dayEvents.length > 2 && <span className="more-events">+{dayEvents.length - 2}</span>}
            </button>
          );
        })}
      </div>
      <div className="calendar-details">
        <div className="panel selected-day-panel">
          <div className="details-head">
            <div>
              <span>Dia selecionado</span>
              <h3>{selectedDateLabel}</h3>
            </div>
            <div className="calendar-day-actions">
              <button
                className="button primary"
                disabled={!canCreateMatch}
                type="button"
                onClick={() => {
                  openForm(selectedDateKey);
                }}
              >
                <Plus size={15} />
                Criar partida
              </button>
              <button className="button secondary" type="button" onClick={() => setView('tryouts')}>
                <UserPlus size={15} />
                Criar peneira
              </button>
            </div>
          </div>
          <div className="selected-events">
            {selectedEvents.map((event) => (
              <article className={`selected-event-card ${event.source}`} key={event.calendarId}>
                {event.source === 'match' ? (
                  <div className="event-logos" aria-hidden="true">
                    <img src={event.homeLogo || logo} alt="" />
                    <img src={event.logo} alt="" />
                  </div>
                ) : (
                  event.logo ? <img src={event.logo} alt="" /> : <div className="avatar small">{getInitials(event.title)}</div>
                )}
                <div>
                  <strong>{event.title}</strong>
                  <span>{event.subtitle}</span>
                  {event.description && <small>{event.description}</small>}
                  {event.championship && <small>{event.championship}</small>}
                </div>
                <div className="event-actions">
                  <small className={`event-status ${getEventStatus(event).toLowerCase().replace(/\s+/g, '-')}`}>{getEventStatus(event)}</small>
                  <button
                    className="button minimal small"
                    type="button"
                    onClick={() => setModal(event.source === 'match'
                      ? { type: 'details', dateKey: event.dateKey, match: event }
                      : { type: 'tryout-details', dateKey: event.dateKey, tryout: event })}
                  >
                    Detalhes
                  </button>
                </div>
              </article>
            ))}
            {selectedEvents.length === 0 && <div className="empty-state">Nenhum evento nesse dia.</div>}
          </div>
        </div>
      </div>
      {modal?.type === 'tryout-details' && (
        <TryoutDetailModal tryout={modal.tryout} onClose={() => setModal(null)} />
      )}
      {modal && modal.type !== 'tryout-details' && (
        <MatchModal
          modal={modal}
          championships={championships}
          isAdmin={canManageMatch}
          players={players}
          setPlayers={setPlayers}
          saving={saving}
          notify={notify}
          refreshClubData={refreshClubData}
          onClose={() => setModal(null)}
          onSave={handleSaveMatch}
          onEdit={(match) => setModal({ type: 'edit-match', dateKey: match.dateKey, match })}
          onDelete={handleDeleteMatch}
        />
      )}
    </section>
  );
}

function TryoutDetailModal({ tryout, onClose }) {
  const players = normalizeTryoutPlayers(tryout.players);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="panel app-modal" role="dialog" aria-modal="true" aria-labelledby="tryout-modal-title">
        <div className="modal-head">
          <div>
            <span>Detalhes da peneira</span>
            <h3 id="tryout-modal-title">{tryout.fullName || 'Peneira do clube'}</h3>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="match-detail-modal">
          <div className="profile-info-grid">
            <div>
              <small>Data e horario</small>
              <strong>{formatDateLabel(tryout.date)} as {tryout.time || 'A definir'}</strong>
            </div>
            <div>
              <small>Local</small>
              <strong>{tryout.place || 'EA FC 26 | Clubs'}</strong>
            </div>
            <div>
              <small>Status</small>
              <strong>{tryout.status || 'Agendada'}</strong>
            </div>
            <div>
              <small>Contato</small>
              <strong>{tryout.contact || 'Nao informado'}</strong>
            </div>
          </div>

          <div className="tryout-detail-list">
            <strong>Jogadores da peneira</strong>
            {players.length > 0 ? players.map((player) => (
              <span key={`${player.name}-${player.position}`}>{player.name} | {player.position}</span>
            )) : <span>{tryout.fullName || 'Jogadores a definir'} | {tryout.position || 'Geral'}</span>}
          </div>

          {tryout.requirements && <p className="modal-note"><strong>Requisitos:</strong> {tryout.requirements}</p>}
          {tryout.notes && <p className="modal-note"><strong>Observacoes:</strong> {tryout.notes}</p>}
        </div>
      </section>
    </div>
  );
}

function MatchModal({
  inline = false,
  modal,
  championships,
  isAdmin,
  players = [],
  setPlayers,
  saving,
  notify,
  refreshClubData,
  onClose,
  onSave,
  onEdit,
  onDelete,
}) {
  const isDetails = modal.type === 'details';
  const match = modal.match || {};
  const [form, setForm] = useState(() => ({
    away: match.away || '',
    dateKey: match.dateKey || modal.dateKey || toDateKey(new Date()),
    time: match.time || '',
    opponentLogo: match.opponentLogo || '',
    whatsappUrl: match.whatsappUrl || WHATSAPP_GROUP_INVITE_URL,
    championshipId: match.championshipId || '',
    championship: match.championship || '',
    place: match.place || 'EA FC 26 | Clubs',
    status: match.status || 'Agendada',
    observations: match.observations || '',
  }));
  const firstFieldRef = useRef(null);

  useEffect(() => {
    window.setTimeout(() => firstFieldRef.current?.focus(), 30);
  }, []);

  const selectedChampionship = championships.find((item) => item.id === form.championshipId);

  const handleLogoFile = async (file) => {
    if (!file) return;
    try {
      const dataUrl = await prepareOpponentLogo(file);
      setForm((current) => ({ ...current, opponentLogo: dataUrl }));
    } catch (error) {
      notify(error.message || 'Nao foi possivel carregar a logo do adversario.');
    }
  };

  const submit = (event) => {
    event.preventDefault();
    if (!form.away.trim() || !form.dateKey || !form.time) {
      return;
    }

    onSave(
      {
        ...form,
        away: form.away.trim(),
        championship: selectedChampionship?.name || form.championship.trim(),
      },
      match.id,
    );
  };

  const content = (
      <section className="panel app-modal" role="dialog" aria-modal={!inline} aria-labelledby="match-modal-title">
        <div className="modal-head">
          <div>
            <span>{isDetails ? 'Detalhes da partida' : match.id ? 'Editar partida' : 'Agenda competitiva'}</span>
            <h3 id="match-modal-title">{isDetails ? `${match.home || 'TorinnoFC'} x ${match.away}` : match.id ? formatDateLabel(form.dateKey) : 'Nova partida no EA FC'}</h3>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        {isDetails ? (
          <div className="match-detail-modal">
            <div className="event-logos large" aria-hidden="true">
              <img src={match.homeLogo || logo} alt="" />
              <img src={match.opponentLogo || buildOpponentLogoDataUrl(match.away)} alt="" />
            </div>
            <div className="profile-info-grid">
              <div>
                <small>Adversario</small>
                <strong>{match.away}</strong>
              </div>
              <div>
                <small>Data e horario</small>
                <strong>{formatDateLabel(match.dateKey)} as {match.time || 'A definir'}</strong>
              </div>
              <div>
                <small>Campeonato</small>
                <strong>{match.championship || 'Nao informado'}</strong>
              </div>
              <div>
                <small>Status</small>
                <strong>{match.status}</strong>
              </div>
            </div>
            {match.observations && <p className="modal-note">{match.observations}</p>}
            {isAdmin && match.status === 'Encerrada' && (
              <div className="match-detail-stats">
                <MatchStatsRecorder
                  match={match}
                  players={players}
                  setPlayers={setPlayers}
                  notify={notify}
                  refreshClubData={refreshClubData}
                />
              </div>
            )}
            <div className="modal-actions">
              <button className="button secondary" type="button" onClick={() => openWhatsAppWithPreparedMessage(match.whatsappUrl, buildMatchWhatsAppMessage(match), notify)}>
                Compartilhar no WhatsApp
              </button>
              {match.whatsappUrl && (
                <button className="button primary" type="button" onClick={() => window.open(match.whatsappUrl, '_blank', 'noopener,noreferrer')}>
                  Acessar grupo do WhatsApp
                </button>
              )}
              {isAdmin && (
                <>
                  <button className="button minimal" type="button" onClick={() => onEdit(match)}>
                    <Edit3 size={15} />
                    Editar partida
                  </button>
                  <button className="button minimal danger" type="button" disabled={saving} onClick={() => onDelete(match.id)}>
                    <Trash2 size={15} />
                    Excluir partida
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <form className="modal-form" onSubmit={submit}>
            <label className="field">
              <span>Nome do adversario</span>
              <input ref={firstFieldRef} value={form.away} onChange={(event) => setForm({ ...form, away: event.target.value })} />
            </label>
            <div className="form-grid">
              <Field label="Data da partida" type="date" value={form.dateKey} onChange={(dateKey) => setForm({ ...form, dateKey })} />
              <Field label="Horario da partida" type="time" value={form.time} onChange={(time) => setForm({ ...form, time })} />
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Campeonato relacionado</span>
                <select value={form.championshipId} onChange={(event) => setForm({ ...form, championshipId: event.target.value, championship: '' })}>
                  <option value="">Sem campeonato</option>
                  {championships.map((championship) => (
                    <option value={championship.id} key={championship.id}>{championship.name}</option>
                  ))}
                </select>
              </label>
              <Field label="Campeonato manual" value={form.championship} onChange={(championship) => setForm({ ...form, championship, championshipId: '' })} />
            </div>
            <Field label="Local" value={form.place} onChange={(place) => setForm({ ...form, place })} />
            <Field label="Link do WhatsApp" value={form.whatsappUrl} onChange={(whatsappUrl) => setForm({ ...form, whatsappUrl })} />
            <div className="form-grid">
              <Field label="Logo por URL" value={form.opponentLogo?.startsWith('data:') ? '' : form.opponentLogo} onChange={(opponentLogo) => setForm({ ...form, opponentLogo })} />
              <label className="field file-field">
                <span>Upload da logo</span>
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(event) => handleLogoFile(event.target.files?.[0])} />
              </label>
            </div>
            {form.opponentLogo && (
              <div className="logo-preview-row">
                <img src={form.opponentLogo} alt="Logo do adversario" />
                <span>Logo carregada</span>
              </div>
            )}
            <label className="field">
              <span>Observacoes</span>
              <textarea value={form.observations} onChange={(event) => setForm({ ...form, observations: event.target.value })} />
            </label>
            <div className="modal-actions">
              <button className="button primary" type="submit" disabled={saving}>
                <Save size={16} />
                {saving ? 'Salvando...' : 'Salvar partida'}
              </button>
              <button className="button minimal" type="button" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </section>
  );

  if (inline) {
    return <div className="match-create-inline">{content}</div>;
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      {content}
    </div>
  );
}

function Ranking({ players, championships = [] }) {
  const [category, setCategory] = useState('overall');
  const [position, setPosition] = useState('Todos');
  const [period, setPeriod] = useState('temporada');
  const categories = {
    overall: { label: 'Geral', value: (player) => calculatePlayerOverall(player), suffix: 'OVR' },
    goals: { label: 'Gols', value: (player) => player.stats.goals },
    assists: { label: 'Assistencias', value: (player) => player.stats.assists },
    recoveries: { label: 'Roubadas', value: (player) => player.stats.recoveries },
    rating: { label: 'Nota media', value: (player) => player.stats.rating },
    matches: { label: 'Partidas', value: (player) => player.stats.matches },
    wins: { label: 'Vitorias', value: (player) => player.stats.wins },
    participation: { label: 'Participacao em gols', value: (player) => player.stats.goals + player.stats.assists },
  };
  const filtered = players.filter((player) => position === 'Todos' || player.position === position);
  const ranked = [...filtered].sort((a, b) => categories[category].value(b) - categories[category].value(a));
  return (
    <section>
      <SectionHeader eyebrow="Ranking" title="Desempenho avancado" />
      <div className="toolbar ranking-toolbar">
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {Object.entries(categories).map(([key, item]) => <option value={key} key={key}>{item.label}</option>)}
        </select>
        <select value={period} onChange={(event) => setPeriod(event.target.value)}>
          <option value="temporada">Temporada</option>
          <option value="mes">Mes atual</option>
          <option value="ultimas">Ultimas partidas</option>
        </select>
        <select value={position} onChange={(event) => setPosition(event.target.value)}>
          <option>Todos</option>
          {positions.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select disabled>
          <option>{championships[0]?.name || 'Todos os campeonatos'}</option>
        </select>
      </div>
      <div className="ranking-list">
        {ranked.map((player, index) => (
          <article className={`ranking-card top-${index + 1}`} key={player.id}>
            <span className="ranking-number">#{index + 1}</span>
            <div className="avatar">{player.avatar}</div>
            <div>
              <strong>{player.nickname}</strong>
              <span>
                Camisa {player.shirt} | {player.position}
              </span>
              <small>{period === 'temporada' ? 'Temporada atual' : 'Filtro preparado para historico por partida'}</small>
            </div>
            <div className="ranking-stat">
              <b>{categories[category].value(player)}</b>
              <small>{categories[category].suffix || categories[category].label}</small>
            </div>
            <span className={`trend ${index < 3 ? 'up' : 'stable'}`}>{index < 3 ? '+1' : '0'}</span>
          </article>
        ))}
        {ranked.length === 0 && <EmptyState icon={Trophy} title="Nenhum jogador cadastrado no elenco." description="O ranking aparece quando houver estatisticas reais." />}
      </div>
    </section>
  );
}

function Team({ players }) {
  return (
    <section className="team-page">
      <div className="team-cover">
        <img src={banner} alt="" />
        <div>
          <span>Organizacao esportiva digital</span>
          <h2>TorinnoFC</h2>
          <p>Uma plataforma para alinhar elenco, desempenho, partidas e identidade do clube.</p>
        </div>
      </div>
      <div className="stats-grid compact">
        <StatCard icon={Shield} value="2026" label="Fundacao" />
        <StatCard icon={Users} value={players.length} label="Atletas" />
        <StatCard icon={Trophy} value="3" label="Frentes" />
      </div>
    </section>
  );
}

function PlayerCompare({ players }) {
  const [leftId, setLeftId] = useState(players[0]?.id || '');
  const [rightId, setRightId] = useState(players[1]?.id || players[0]?.id || '');
  const left = players.find((player) => player.id === leftId) || players[0];
  const right = players.find((player) => player.id === rightId) || players[1] || players[0];
  const metrics = [
    ['matches', 'Partidas', (player) => player.stats.matches],
    ['goals', 'Gols', (player) => player.stats.goals],
    ['assists', 'Assistencias', (player) => player.stats.assists],
    ['recoveries', 'Roubadas', (player) => player.stats.recoveries],
    ['shots', 'Finalizacoes', (player) => player.stats.shots],
    ['passes', 'Passes certos', (player) => player.stats.passes],
    ['tackles', 'Desarmes', (player) => player.stats.tackles],
    ['interceptions', 'Interceptacoes', (player) => player.stats.interceptions],
    ['rating', 'Nota media', (player) => player.stats.rating],
    ['wins', 'Vitorias', (player) => player.stats.wins],
    ['participation', 'Participacao em gols', (player) => player.stats.goals + player.stats.assists],
    ['overall', 'Overall', calculatePlayerOverall],
  ];
  const radarMetrics = [
    ['Gols', (player) => player.stats.goals],
    ['Assistencias', (player) => player.stats.assists],
    ['Roubadas', (player) => player.stats.recoveries],
    ['Nota media', (player) => player.stats.rating],
    ['Overall', calculatePlayerOverall],
  ];

  const radarValue = (player, getter) => {
    const highest = Math.max(1, ...players.map((item) => Number(getter(item)) || 0));
    return Math.round(((Number(getter(player)) || 0) / highest) * 100);
  };
  const leftWins = metrics.filter(([, , getter]) => getter(left) > getter(right)).length;
  const rightWins = metrics.filter(([, , getter]) => getter(right) > getter(left)).length;
  const ties = metrics.length - leftWins - rightWins;

  if (players.length < 2) {
    return (
      <section>
        <SectionHeader eyebrow="Comparacao" title="Jogadores" />
        <EmptyState icon={BarChart3} title="Cadastre ao menos dois jogadores." description="A comparacao usa somente estatisticas reais do elenco." />
      </section>
    );
  }

  return (
    <section>
      <SectionHeader eyebrow="Comparacao" title="Jogador x jogador" />
      <div className="toolbar compare-toolbar">
        <label className="compare-select gold">
          <span>Jogador 1</span>
          <select value={left?.id || ''} onChange={(event) => setLeftId(event.target.value)}>
            {players.map((player) => <option key={player.id} value={player.id} disabled={player.id === right?.id}>{player.nickname}</option>)}
          </select>
        </label>
        <span className="compare-versus">VS</span>
        <label className="compare-select red">
          <span>Jogador 2</span>
          <select value={right?.id || ''} onChange={(event) => setRightId(event.target.value)}>
            {players.map((player) => <option key={player.id} value={player.id} disabled={player.id === left?.id}>{player.nickname}</option>)}
          </select>
        </label>
      </div>
      <div className="compare-player-strip">
        <div className="compare-player gold">
          <div className={`avatar ${left.photo ? 'has-photo' : ''}`}>{left.photo ? <img src={left.photo} alt="" /> : getInitials(left.nickname)}</div>
          <div><strong>{left.nickname}</strong><span>{left.position} | #{left.shirt}</span></div>
          <b>{calculatePlayerOverall(left)} <small>OVR</small></b>
        </div>
        <div className="compare-score"><strong>{leftWins}</strong><span>{ties} empates</span><strong>{rightWins}</strong></div>
        <div className="compare-player red">
          <b>{calculatePlayerOverall(right)} <small>OVR</small></b>
          <div><strong>{right.nickname}</strong><span>{right.position} | #{right.shirt}</span></div>
          <div className={`avatar ${right.photo ? 'has-photo' : ''}`}>{right.photo ? <img src={right.photo} alt="" /> : getInitials(right.nickname)}</div>
        </div>
      </div>
      <div className="compare-layout">
        <article className="panel dashboard-panel compare-radar-card">
          <div className="dashboard-panel-head">
            <div><span>Indice comparativo</span><h3>{left.nickname} x {right.nickname}</h3></div>
            <small>Cada eixo vai de 0 a 100 em relacao ao melhor valor do elenco.</small>
          </div>
          <ApexChart
            className="chart-box comparison-chart"
            options={{
              chart: { type: 'radar', toolbar: { show: false }, foreColor: '#cbd5e1', parentHeightOffset: 0 },
              series: [
                { name: left.nickname, data: radarMetrics.map(([, getter]) => radarValue(left, getter)) },
                { name: right.nickname, data: radarMetrics.map(([, getter]) => radarValue(right, getter)) },
              ],
              xaxis: {
                categories: radarMetrics.map(([label]) => label),
                labels: { style: { colors: Array(radarMetrics.length).fill('#cbd5e1'), fontSize: '12px', fontWeight: 700 } },
              },
              colors: ['#d4a24c', '#8a1024'],
              yaxis: { show: false, min: 0, max: 100, tickAmount: 5 },
              fill: { opacity: 0.2 },
              stroke: { width: 2.5 },
              markers: { size: 4, strokeWidth: 2, hover: { size: 6 } },
              legend: { position: 'bottom', fontSize: '13px', fontWeight: 700, markers: { size: 6 } },
              plotOptions: { radar: { size: 120, polygons: { strokeColors: 'rgba(148, 163, 184, 0.18)', connectorColors: 'rgba(148, 163, 184, 0.14)', fill: { colors: ['rgba(255,255,255,0.018)', 'rgba(255,255,255,0.035)'] } } } },
              tooltip: { y: { formatter: (value) => `${Math.round(value)} / 100` } },
            }}
          />
        </article>
        <article className="panel dashboard-panel compare-stats-card">
          <div className="comparison-head">
            <strong>{left.nickname}</strong>
            <span>Estatisticas</span>
            <strong>{right.nickname}</strong>
          </div>
          <div className="comparison-table">
            {metrics.map(([key, label, getter]) => {
              const leftValue = getter(left);
              const rightValue = getter(right);
              return (
                <div className="comparison-row" key={key}>
                  <b className={leftValue >= rightValue ? 'best' : ''}>{leftValue}</b>
                  <span>{label}</span>
                  <b className={rightValue >= leftValue ? 'best' : ''}>{rightValue}</b>
                </div>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
}

function Championships({ user, championships = [], saveChampionship, removeChampionship, serverState, notify }) {
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === 'admin';

  const handleSave = async (form, existingId) => {
    setSaving(true);
    try {
      await saveChampionship(form, existingId);
      setModal(null);
      notify(existingId ? 'Campeonato atualizado.' : 'Campeonato cadastrado.');
    } catch (error) {
      notify(error.message || 'Nao foi possivel salvar o campeonato.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este campeonato?')) return;

    setSaving(true);
    try {
      await removeChampionship(id);
      notify('Campeonato excluido.');
    } catch (error) {
      notify(error.message || 'Nao foi possivel excluir o campeonato.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="section-title-actions">
        <SectionHeader eyebrow="Competicoes" title="Campeonatos" />
        {isAdmin && (
          <button className="button primary" type="button" onClick={() => setModal({})}>
            <Plus size={15} />
            Adicionar campeonato
          </button>
        )}
      </div>
      {serverState?.loading && <div className="empty-state">Carregando campeonatos...</div>}
      {!serverState?.loading && serverState?.error && <div className="empty-state">{serverState.error}</div>}
      {!serverState?.loading && !serverState?.error && championships.length === 0 && (
        <EmptyState icon={Trophy} title="Nenhum campeonato cadastrado." description={isAdmin ? 'Use o botao Adicionar campeonato para criar o primeiro registro real.' : 'Quando um campeonato for cadastrado, ele aparece aqui.'} />
      )}
      <div className="card-grid championship-grid">
        {championships.map((championship) => (
          <article className="panel championship-card" key={championship.id}>
            {championship.imageUrl ? <img src={championship.imageUrl} alt={`Imagem do campeonato ${championship.name}`} /> : <Trophy size={24} />}
            <h3>{championship.name}</h3>
            <p>{championship.description || championship.format || 'Campeonato do Torinno FC.'}</p>
            <div className="championship-meta">
              <span>{championship.season || 'Temporada nao informada'}</span>
              <small>{championshipStatusLabel(championship.status)}</small>
            </div>
            <div className="modal-actions">
              {championship.officialUrl && (
                <button className="button minimal" type="button" onClick={() => window.open(championship.officialUrl, '_blank', 'noopener,noreferrer')}>
                  Link oficial
                </button>
              )}
              {isAdmin && (
                <>
                  <button className="button minimal" type="button" onClick={() => setModal(championship)}>
                    Editar
                  </button>
                  <button className="button minimal danger" type="button" disabled={saving} onClick={() => handleDelete(championship.id)}>
                    Excluir
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
      {modal && (
        <ChampionshipModal
          championship={modal.id ? modal : null}
          saving={saving}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </section>
  );
}

function ChampionshipModal({ championship, saving, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    name: championship?.name || '',
    image_url: championship?.imageUrl || '',
    season: championship?.season || '',
    start_date: championship?.startDate || '',
    end_date: championship?.endDate || '',
    format: championship?.format || '',
    status: championship?.status || 'futuro',
    official_url: championship?.officialUrl || '',
    description: championship?.description || '',
  }));
  const firstFieldRef = useRef(null);

  useEffect(() => {
    window.setTimeout(() => firstFieldRef.current?.focus(), 30);
  }, []);

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, name: form.name.trim() }, championship?.id);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="panel app-modal" role="dialog" aria-modal="true" aria-labelledby="championship-modal-title">
        <div className="modal-head">
          <div>
            <span>Campeonato</span>
            <h3 id="championship-modal-title">{championship ? 'Editar campeonato' : 'Adicionar campeonato'}</h3>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <form className="modal-form" onSubmit={submit}>
          <label className="field">
            <span>Nome do campeonato</span>
            <input ref={firstFieldRef} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <div className="form-grid">
            <Field label="Logo ou imagem" value={form.image_url} onChange={(image_url) => setForm({ ...form, image_url })} />
            <Field label="Temporada" value={form.season} onChange={(season) => setForm({ ...form, season })} />
          </div>
          <div className="form-grid">
            <Field label="Data de inicio" type="date" value={form.start_date} onChange={(start_date) => setForm({ ...form, start_date })} />
            <Field label="Data de termino" type="date" value={form.end_date} onChange={(end_date) => setForm({ ...form, end_date })} />
          </div>
          <div className="form-grid">
            <Field label="Formato" value={form.format} onChange={(format) => setForm({ ...form, format })} />
            <label className="field">
              <span>Status</span>
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="futuro">Futuro</option>
                <option value="em_andamento">Em andamento</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </label>
          </div>
          <Field label="Link oficial" value={form.official_url} onChange={(official_url) => setForm({ ...form, official_url })} />
          <label className="field">
            <span>Descricao opcional</span>
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <div className="modal-actions">
            <button className="button primary" type="submit" disabled={saving}>
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar campeonato'}
            </button>
            <button className="button minimal" type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function AdminPanel({ user, users, setUsers, players, matches, saveMatch, setUserRole, createPlayer, removePlayer, notify, refreshClubData }) {
  const [newMatch, setNewMatch] = useState({
    away: '',
    date: toDateKey(new Date()),
    time: '',
    whatsappUrl: WHATSAPP_GROUP_INVITE_URL,
    opponentLogo: null,
    opponentLogoPreview: '',
  });
  const [newPlayer, setNewPlayer] = useState({ nickname: '', position: 'Atacante', shirt: '11' });
  const playerPositionOptions = ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meio-campo', 'Atacante'];

  const handleOpponentLogoChange = async (file) => {
    if (!file) {
      return;
    }

    try {
      const dataUrl = await prepareOpponentLogo(file);
      setNewMatch({
        ...newMatch,
        opponentLogo: file,
        opponentLogoPreview: dataUrl,
      });
    } catch (error) {
      notify(error.message || 'Nao foi possivel carregar a logo do adversario.');
    }
  };

  const handleCreateMatch = async () => {
    if (!newMatch.away.trim() || !newMatch.date || !newMatch.time) {
      notify('Preencha adversario, data e hora da partida.');
      return;
    }

    if (!newMatch.opponentLogoPreview) {
      notify('Selecione a logo do adversario.');
      return;
    }

    const matchDate = new Date(`${newMatch.date}T00:00:00`);
    const match = normalizeMatchEvent({
      id: Date.now(),
      home: 'TorinnoFC',
      homeLogo: logo,
      away: newMatch.away.trim(),
      date: formatDateLabel(newMatch.date),
      time: newMatch.time,
      place: 'A definir',
      championship: 'Admin',
      whatsappUrl: newMatch.whatsappUrl,
      status: 'Agendada',
      score: '-',
      dateKey: toDateKey(matchDate),
      opponentLogo: newMatch.opponentLogoPreview,
      opponentLogoName: newMatch.opponentLogo?.name || '',
    });

    if (isDuplicateMatch(matches, match)) {
      notify('Essa partida ja foi cadastrada nesse dia e horario.');
      return;
    }

    try {
      await saveMatch(match);
      notify('Partida cadastrada com sucesso.');
    } catch (error) {
      notify(error.message || 'Nao foi possivel criar a partida.');
      return;
    }
    setNewMatch({
      away: '',
      date: toDateKey(new Date()),
      time: '',
      whatsappUrl: WHATSAPP_GROUP_INVITE_URL,
      opponentLogo: null,
      opponentLogoPreview: '',
    });
  };

  const handleAddPlayer = () => {
    if (!newPlayer.nickname.trim()) {
      notify('Digite o apelido do jogador.');
      return;
    }

    if (!isValidShirtNumber(newPlayer.shirt)) {
      notify('Digite uma camisa valida entre 1 e 999.');
      return;
    }

    if (players.some((player) => player.nickname.toLowerCase() === newPlayer.nickname.trim().toLowerCase())) {
      notify('Ja existe um jogador com esse apelido.');
      return;
    }

    createPlayer({
      fullName: newPlayer.nickname.trim(),
      nickname: newPlayer.nickname.trim(),
      position: newPlayer.position,
      shirt: Number(newPlayer.shirt),
      status: 'Ativo',
      stats: { goals: 0, assists: 0, recoveries: 0, matches: 0, wins: 0, losses: 0, rating: 0 },
    })
      .then(() => {
        notify('Jogador cadastrado.');
        setNewPlayer({ nickname: '', position: 'Atacante', shirt: '11' });
      })
      .catch((error) => notify(error.message || 'Nao foi possivel cadastrar o jogador.'));
  };

  if (user.role !== 'admin') {
    return (
      <section>
        <SectionHeader eyebrow="Administracao" title="Acesso restrito" />
        <div className="panel">
          <ShieldCheck size={24} />
          <h3>Somente administradores</h3>
          <p>Seu perfil esta como {user.staffRole || roleLabel(user.role)}. Peça para um admin liberar seu cargo.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <SectionHeader eyebrow="Administracao" title="Controle do clube" />
      <div className="admin-grid club-control-grid">
        <div className="panel club-control-card">
          <div className="card-title-row">
            <Users size={19} />
            <h3>Usuarios cadastrados</h3>
          </div>
          <div className="member-list">
            {users.map((account) => {
              const isFounder = account.staffRole === 'Fundador';
              const isRemoved = account.accountStatus === 'removed';
              return (
                <div className="member-row" key={account.id}>
                  <div className={`avatar small ${account.photo ? 'has-photo' : ''}`}>
                    {account.photo ? <img src={account.photo} alt={`Foto de ${account.nickname || account.name}`} /> : getInitials(account.nickname || account.name)}
                  </div>
                  <div className="member-copy">
                    <strong>{account.name || account.nickname}</strong>
                    <span>{account.nickname || 'Sem apelido'} | {account.email}</span>
                    <small>{account.staffRole || roleLabel(account.role)} | {account.accountStatus || 'active'} | Entrada: {account.joinedAt ? formatDateLabel(account.joinedAt.slice(0, 10)) : 'Nao informada'} | Jogador: {account.hasPlayerProfile || account.playerId ? 'vinculado' : 'sem vinculo'}</small>
                  </div>
                  <button
                    className={`role-badge ${account.role === 'admin' ? 'admin' : 'player'}`}
                    type="button"
                    disabled={isFounder && account.id !== user.id}
                    onClick={async () => {
                      const nextRole = account.role === 'admin' ? 'player' : 'admin';
                      if (!window.confirm(`${nextRole === 'admin' ? 'Promover' : 'Rebaixar'} ${account.nickname || account.name}?`)) {
                        return;
                      }
                      try {
                        const updated = await setUserRole(account, nextRole);
                        notify(`${account.nickname || account.name} agora e ${updated.staffRole || roleLabel(updated.role)}.`);
                      } catch (error) {
                        notify(error.message || 'Nao foi possivel alterar a permissao.');
                      }
                    }}
                  >
                    {isFounder ? 'Fundador' : roleLabel(account.role)}
                  </button>
                  {!isFounder && account.id !== user.id && (
                    <button
                      className={`button minimal small ${isRemoved ? '' : 'danger'}`}
                      type="button"
                      onClick={async () => {
                        const nextStatus = isRemoved ? 'active' : 'removed';
                        if (!window.confirm(`${isRemoved ? 'Restaurar' : 'Remover'} o acesso de ${account.nickname || account.name}?`)) return;
                        try {
                          const updated = await apiUpdateUserStatus(account.backendId || account.id, nextStatus);
                          setUsers((items) => items.map((item) => (
                            item.id === account.id ? { ...item, accountStatus: updated.accountStatus } : item
                          )));
                          await refreshClubData?.({ silent: true });
                          notify(isRemoved ? 'Acesso restaurado.' : 'Jogador removido da plataforma.');
                        } catch (error) {
                          notify(error.message || 'Nao foi possivel alterar o acesso deste usuario.');
                        }
                      }}
                    >
                      {isRemoved ? 'Restaurar acesso' : 'Remover acesso'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="panel club-control-card match-control-card">
          <div className="card-title-row">
            <CalendarDays size={19} />
            <h3>Criar partida</h3>
          </div>
          <Field label="Adversario" placeholder="Nome do adversario" value={newMatch.away} onChange={(away) => setNewMatch({ ...newMatch, away })} />
          <div className="form-grid">
            <Field label="Data" type="date" value={newMatch.date} onChange={(date) => setNewMatch({ ...newMatch, date })} />
            <Field label="Hora" type="time" value={newMatch.time} onChange={(time) => setNewMatch({ ...newMatch, time })} />
          </div>
          <Field label="Link do WhatsApp" value={newMatch.whatsappUrl} onChange={(whatsappUrl) => setNewMatch({ ...newMatch, whatsappUrl })} />
          <label
            className={`logo-upload ${newMatch.opponentLogoPreview ? 'has-preview' : ''}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleOpponentLogoChange(event.dataTransfer.files?.[0]);
            }}
          >
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(event) => handleOpponentLogoChange(event.target.files?.[0])}
            />
            {newMatch.opponentLogoPreview ? (
              <img src={newMatch.opponentLogoPreview} alt="Preview da logo do adversario" />
            ) : (
              <div className="upload-placeholder">
                <UploadCloud size={24} />
                <strong>Selecione ou arraste uma imagem aqui</strong>
                <span>PNG, JPG ou WEBP | Max. 5MB</span>
              </div>
            )}
          </label>
          <button
            className="button primary full"
            type="button"
            onClick={handleCreateMatch}
          >
            <Plus size={16} />
            Criar partida
          </button>
        </div>
        <div className="panel club-control-card">
          <div className="card-title-row">
            <UserPlus size={19} />
            <h3>Cadastrar jogador</h3>
          </div>
          <Field label="Apelido" placeholder="Apelido do jogador" value={newPlayer.nickname} onChange={(nickname) => setNewPlayer({ ...newPlayer, nickname })} />
          <label className="field">
            <span>Posicao</span>
            <select value={newPlayer.position} onChange={(event) => setNewPlayer({ ...newPlayer, position: event.target.value })}>
              {playerPositionOptions.map((position) => (
                <option key={position}>{position}</option>
              ))}
            </select>
          </label>
          <Field label="Camisa" type="number" placeholder="Numero da camisa" value={newPlayer.shirt} onChange={(shirt) => setNewPlayer({ ...newPlayer, shirt })} />
          <button
            className="button primary full"
            type="button"
            onClick={handleAddPlayer}
          >
            <Plus size={16} />
            Adicionar jogador
          </button>
          <div className="member-list admin-player-list">
            {players.map((player) => (
              <div className="member-row" key={player.id}>
                <div className="avatar small">{player.photo ? <img src={player.photo} alt={`Foto de ${player.nickname}`} /> : getInitials(player.nickname)}</div>
                <div className="member-copy">
                  <strong>{player.nickname}</strong>
                  <span>{player.position} | #{player.shirt}</span>
                </div>
                <button
                  className="button minimal small danger"
                  type="button"
                  onClick={() => {
                    if (!window.confirm(`Remover ${player.nickname} do elenco?`)) return;
                    removePlayer(player.id)
                      .then(() => notify('Jogador removido do elenco.'))
                      .catch((error) => notify(error.message || 'Nao foi possivel remover o jogador.'));
                  }}
                >
                  Remover
                </button>
              </div>
            ))}
            {players.length === 0 && <div className="empty-state">Nenhum jogador cadastrado no elenco.</div>}
          </div>
        </div>
      </div>
    </section>
  );
}

const defaultAppSettings = {
  appearance: {
    darkTheme: true,
  },
  notifications: {
    matchAlerts: true,
    newMatch: true,
    newTryout: true,
    newPlayer: true,
    performanceUpdated: true,
    preMatchAlert: true,
  },
  permissions: {
    admin: {
      createMatch: true,
      editMatch: true,
      deleteMatch: true,
      createPlayer: true,
      editPlayer: true,
      removePlayer: true,
      manageCalendar: true,
      manageClubProfile: true,
      sendNotifications: true,
      managePermissions: true,
    },
    player: {
      viewCalendar: true,
      viewMatches: true,
      createMatch: true,
      manageTryouts: true,
      editOwnPerformance: true,
      viewOwnProfile: true,
      viewTeamInfo: true,
    },
  },
  matches: {
    adminsCreateMatches: true,
    playersSeeFutureMatches: true,
    showOpponentLogo: true,
    showFinishedMatches: true,
    allowEditAfterCreate: true,
  },
  players: {
    adminsCreatePlayers: true,
    playersEditOwnProfile: true,
    playersEditOwnStats: true,
    requirePerformanceApproval: false,
    showShirtOnProfile: true,
    showPositionOnProfile: true,
  },
};

function mergeSettings(saved) {
  return {
    appearance: { ...defaultAppSettings.appearance, ...saved?.appearance },
    notifications: { ...defaultAppSettings.notifications, ...saved?.notifications },
    permissions: {
      admin: { ...defaultAppSettings.permissions.admin, ...saved?.permissions?.admin },
      player: { ...defaultAppSettings.permissions.player, ...saved?.permissions?.player },
    },
    matches: { ...defaultAppSettings.matches, ...saved?.matches },
    players: { ...defaultAppSettings.players, ...saved?.players },
  };
}

function readAppSettings() {
  try {
    return mergeSettings(JSON.parse(localStorage.getItem('torinnofc-settings') || '{}'));
  } catch {
    return defaultAppSettings;
  }
}

function SettingsPage({
  user,
  setUser,
  users,
  setUsers,
  setUserRole,
  notify,
  notificationPreferences,
  saveNotificationPreferences,
  refreshClubData,
}) {
  const [settings, setSettings] = useState(readAppSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [promotionPassword, setPromotionPassword] = useState('');
  const [promoting, setPromoting] = useState(false);
  const isFounder = user.staffRole === 'Fundador';
  const canManagePermissions = isFounder || user.role === 'admin';

  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', !settings.appearance.darkTheme);
  }, [settings]);

  useEffect(() => {
    let active = true;
    const loadSettings = async () => {
      setSettingsLoading(true);
      try {
        const [personal, club, permissions] = await Promise.all([
          fetchMySettings().catch(() => null),
          user.role === 'admin' ? fetchClubSettings().catch(() => null) : Promise.resolve(null),
          user.role === 'admin' ? fetchRolePermissions().catch(() => null) : Promise.resolve(null),
        ]);
        if (!active) return;
        setSettings((current) => mergeSettings({
          ...current,
          ...personal,
          ...club,
          ...(permissions ? { permissions } : {}),
        }));
      } catch (error) {
        if (active) notify(error.message || 'Nao foi possivel carregar configuracoes.');
      } finally {
        if (active) setSettingsLoading(false);
      }
    };

    loadSettings();
    return () => {
      active = false;
    };
  }, [user.id, user.role]);

  const updateSetting = async (group, key) => {
    const previous = settings;
    const next = {
      ...settings,
      [group]: { ...settings[group], [key]: !settings[group][key] },
    };
    setSettings(next);
    setSavingKey(`${group}.${key}`);
    try {
      if (group === 'appearance' || group === 'notifications') {
        const saved = await updateMySettings({
          appearance: next.appearance,
          notifications: next.notifications,
        });
        setSettings((current) => mergeSettings({ ...current, ...saved }));
      } else {
        const saved = await updateClubSettings({
          rules: next.rules,
          notifications: next.notifications,
          matches: next.matches,
          players: next.players,
        });
        setSettings((current) => mergeSettings({ ...current, ...saved }));
      }
      notify('Configuracao salva.');
    } catch (error) {
      setSettings(previous);
      notify(error.message || 'Nao foi possivel salvar a configuracao.');
    } finally {
      setSavingKey('');
    }
  };

  const updatePermission = async (role, key) => {
    if (!canManagePermissions) {
      notify('Apenas administradores autorizados podem alterar permissoes.');
      return;
    }

    const previous = settings;
    const enabled = !settings.permissions[role][key];
    setSettings({
      ...settings,
      permissions: {
        ...settings.permissions,
        [role]: {
          ...settings.permissions[role],
          [key]: enabled,
        },
      },
    });
    setSavingKey(`${role}.${key}`);
    try {
      const permissions = await updateRolePermission(role, key, enabled);
      setSettings((current) => mergeSettings({ ...current, permissions }));
      notify('Permissao salva.');
    } catch (error) {
      setSettings(previous);
      notify(error.message || 'Nao foi possivel salvar a permissao.');
    } finally {
      setSavingKey('');
    }
  };

  const updateUserRole = async (account, nextStaffRole) => {
    if (!canManagePermissions) {
      notify('Voce nao tem permissao para alterar cargos.');
      return;
    }

    const founderCount = users.filter((item) => item.staffRole === 'Fundador').length;
    if (account.staffRole === 'Fundador' && nextStaffRole !== 'Fundador' && founderCount <= 1) {
      notify('Nao e possivel remover o ultimo fundador.');
      return;
    }

    const nextRole = nextStaffRole === 'Jogador' ? 'player' : 'admin';
    try {
      const updated = await setUserRole(account, nextRole);
      setUsers(
        users.map((item) =>
          item.id === account.id
            ? { ...item, role: updated.role, staffRole: updated.staffRole, backendId: updated.id }
            : item,
        ),
      );
      notify(`${account.nickname} agora e ${updated.staffRole || roleLabel(updated.role)}.`);
    } catch (error) {
      notify(error.message || 'Nao foi possivel alterar o cargo.');
    }
  };

  const promoteToAdmin = async (event) => {
    event.preventDefault();
    if (!promotionPassword) {
      notify('Digite a senha administrativa.');
      return;
    }
    setPromoting(true);
    try {
      const updated = await apiPromoteCurrentUser(promotionPassword);
      const promoted = normalizeUser({
        ...user,
        ...updated,
        id: user.id,
        backendId: updated.id,
        role: 'admin',
        staffRole: 'Admin',
      });
      setUser(publicUser(promoted));
      setUsers((items) => {
        const exists = items.some((item) => item.id === user.id || item.email?.toLowerCase() === user.email?.toLowerCase());
        return exists
          ? items.map((item) => (item.id === user.id || item.email?.toLowerCase() === user.email?.toLowerCase() ? promoted : item))
          : [promoted, ...items];
      });
      setPromotionPassword('');
      await refreshClubData?.({ silent: true });
      notify('Acesso administrativo ativado. A aba Admin ja esta disponivel.');
    } catch (error) {
      notify(error.message || 'Nao foi possivel ativar o acesso administrativo.');
    } finally {
      setPromoting(false);
    }
  };

  return (
    <section className="settings-page">
      <SectionHeader eyebrow="Preferencias" title="Configuracoes" />
      {settingsLoading && <div className="settings-warning">Carregando configuracoes...</div>}

      <SettingsGroup title="Conta">
        <div className="panel settings-account-card">
          <div className="avatar small">{getInitials(user.nickname || user.name)}</div>
          <div className="settings-account-copy">
            <strong>{user.name || user.nickname || 'Usuario TorinnoFC'}</strong>
            <span>{user.email}</span>
          </div>
          <span className={`role-badge ${user.role === 'admin' ? 'admin' : 'player'}`}>{user.staffRole || roleLabel(user.role)}</span>
        </div>
        {user.role !== 'admin' && (
          <form className="panel admin-access-card" onSubmit={promoteToAdmin}>
            <div className="admin-access-copy">
              <ShieldCheck size={20} />
              <div>
                <strong>Alterar cargo para Administrador</strong>
                <span>Informe a senha de seguranca para liberar o painel administrativo.</span>
              </div>
            </div>
            <Field label="Senha administrativa" type="password" value={promotionPassword} onChange={setPromotionPassword} />
            <button className="button primary" type="submit" disabled={promoting}>
              <ShieldCheck size={16} />
              {promoting ? 'Validando...' : 'Ativar Admin'}
            </button>
          </form>
        )}
        <PasswordChangeCard notify={notify} />
      </SettingsGroup>

      <SettingsGroup title="Geral">
        <SettingsItem title="Tema escuro" checked={settings.appearance.darkTheme} disabled={savingKey === 'appearance.darkTheme'} onChange={() => updateSetting('appearance', 'darkTheme')} />
        <SettingsItem title="Alertas de partidas" checked={settings.notifications.matchAlerts} disabled={savingKey === 'notifications.matchAlerts'} onChange={() => updateSetting('notifications', 'matchAlerts')} />
        <SettingsItem title="Novas partidas" checked={settings.notifications.newMatch} disabled={savingKey === 'notifications.newMatch'} onChange={() => updateSetting('notifications', 'newMatch')} />
        <SettingsItem title="Novas peneiras" checked={settings.notifications.newTryout} disabled={savingKey === 'notifications.newTryout'} onChange={() => updateSetting('notifications', 'newTryout')} />
      </SettingsGroup>

      <SettingsGroup title="Preferencias de notificacoes">
        {!notificationPreferences && <div className="settings-warning">Preferencias ainda nao carregadas. Atualize novamente em alguns segundos.</div>}
        {notificationPreferences && (
          <>
            <SettingsItem title="Partidas agendadas" checked={notificationPreferences.matchCreated} onChange={() => saveNotificationPreferences({ ...notificationPreferences, matchCreated: !notificationPreferences.matchCreated })} />
            <SettingsItem title="Alteracoes de partidas" checked={notificationPreferences.matchUpdated} onChange={() => saveNotificationPreferences({ ...notificationPreferences, matchUpdated: !notificationPreferences.matchUpdated })} />
            <SettingsItem title="Peneiras criadas" checked={notificationPreferences.tryoutCreated ?? true} onChange={() => saveNotificationPreferences({ ...notificationPreferences, tryoutCreated: !(notificationPreferences.tryoutCreated ?? true) })} />
            <SettingsItem title="Lembretes de 24 horas" checked={notificationPreferences.matchReminder24h} onChange={() => saveNotificationPreferences({ ...notificationPreferences, matchReminder24h: !notificationPreferences.matchReminder24h })} />
            <SettingsItem title="Lembretes de 1 hora" checked={notificationPreferences.matchReminder1h} onChange={() => saveNotificationPreferences({ ...notificationPreferences, matchReminder1h: !notificationPreferences.matchReminder1h })} />
            <SettingsItem title="Campeonatos" checked={notificationPreferences.championships} onChange={() => saveNotificationPreferences({ ...notificationPreferences, championships: !notificationPreferences.championships })} />
            <SettingsItem title="Novos membros" checked={notificationPreferences.newMembers} onChange={() => saveNotificationPreferences({ ...notificationPreferences, newMembers: !notificationPreferences.newMembers })} />
            <SettingsItem title="Estatisticas" checked={notificationPreferences.statistics} onChange={() => saveNotificationPreferences({ ...notificationPreferences, statistics: !notificationPreferences.statistics })} />
            <SettingsItem title="Alteracoes administrativas" checked={notificationPreferences.administration} onChange={() => saveNotificationPreferences({ ...notificationPreferences, administration: !notificationPreferences.administration })} />
          </>
        )}
      </SettingsGroup>

      {user.role === 'admin' && (
        <>
          <SettingsGroup title="Permissoes">
            {!canManagePermissions && <div className="settings-warning">Apenas Fundador ou Administrador autorizado pode alterar permissoes.</div>}
            <div className="permission-grid">
              <PermissionCard
                title="Fundador"
                description="Acesso total"
                fixed
              />
              <PermissionCard
                title="Admin"
                description="Acesso completo a jogadores, campeonatos, partidas, peneiras, calendario, desempenho e permissoes."
                fixed
              />
              <PermissionCard
                title="Jogador"
                permissions={settings.permissions.player}
                labels={{
                  viewCalendar: 'Calendario',
                  viewMatches: 'Partidas',
                  createMatch: 'Criar partida',
                  manageTryouts: 'Criar peneira',
                  editOwnPerformance: 'Desempenho',
                }}
                disabled={!canManagePermissions}
                onToggle={(key) => updatePermission('player', key)}
              />
            </div>
          </SettingsGroup>

          <SettingsGroup title="Cargos">
            <div className="user-role-list">
              {users.map((account) => (
                <UserRoleRow
                  account={account}
                  key={account.id}
                  disabled={!canManagePermissions}
                  onChange={(nextRole) => updateUserRole(account, nextRole)}
                />
              ))}
            </div>
          </SettingsGroup>

          <SettingsGroup title="Regras">
            <SettingsItem title="Admin cria partidas" checked={settings.matches.adminsCreateMatches} disabled={savingKey === 'matches.adminsCreateMatches'} onChange={() => updateSetting('matches', 'adminsCreateMatches')} />
            <SettingsItem title="Jogadores veem agenda" checked={settings.matches.playersSeeFutureMatches} disabled={savingKey === 'matches.playersSeeFutureMatches'} onChange={() => updateSetting('matches', 'playersSeeFutureMatches')} />
            <SettingsItem title="Cadastro de jogador pelo admin" checked={settings.players.adminsCreatePlayers} disabled={savingKey === 'players.adminsCreatePlayers'} onChange={() => updateSetting('players', 'adminsCreatePlayers')} />
            <SettingsItem title="Jogador edita perfil" checked={settings.players.playersEditOwnProfile} disabled={savingKey === 'players.playersEditOwnProfile'} onChange={() => updateSetting('players', 'playersEditOwnProfile')} />
            <SettingsItem title="Jogador edita estatisticas" checked={settings.players.playersEditOwnStats} disabled={savingKey === 'players.playersEditOwnStats'} onChange={() => updateSetting('players', 'playersEditOwnStats')} />
            <SettingsItem title="Aprovacao de desempenho" checked={settings.players.requirePerformanceApproval} disabled={savingKey === 'players.requirePerformanceApproval'} onChange={() => updateSetting('players', 'requirePerformanceApproval')} />
          </SettingsGroup>
        </>
      )}
    </section>
  );
}

function PasswordChangeCard({ notify }) {
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!hasSupabaseConfig) {
      notify('Troca de senha exige Supabase configurado.');
      return;
    }
    if (form.password.length < 6) {
      notify('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (form.password !== form.confirm) {
      notify('As senhas nao conferem.');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: form.password });
      if (error) {
        notify('Nao foi possivel trocar a senha.');
        return;
      }
      setForm({ password: '', confirm: '' });
      notify('Senha atualizada.');
    } catch {
      notify('Nao foi possivel trocar a senha.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="panel settings-password-form" onSubmit={submit}>
      <div className="settings-password-copy">
        <strong>Trocar senha</strong>
        <span>Use uma senha com pelo menos 6 caracteres.</span>
      </div>
      <Field label="Nova senha" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
      <Field label="Confirmar senha" type="password" value={form.confirm} onChange={(confirm) => setForm({ ...form, confirm })} />
      <button className="button primary" type="submit" disabled={saving}>
        <Save size={16} />
        {saving ? 'Salvando...' : 'Salvar senha'}
      </button>
    </form>
  );
}

function SettingsGroup({ title, description, children }) {
  return (
    <div className="settings-group">
      <div className="settings-group-head">
        <span>{title}</span>
        {description && <p>{description}</p>}
      </div>
      <div className="settings-group-body">{children}</div>
    </div>
  );
}

function SettingsItem({ title, description, checked, onChange, disabled = false }) {
  return (
    <div className="panel settings-panel">
      <div>
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </div>
      <ToggleSwitch checked={checked} disabled={disabled} onChange={onChange} label={title} />
    </div>
  );
}

function ToggleSwitch({ checked, onChange, disabled = false, label }) {
  return (
    <button
      className={`toggle ${checked ? 'active' : ''}`}
      type="button"
      aria-label={label}
      aria-pressed={checked}
      disabled={disabled}
      onClick={onChange}
    />
  );
}

function PermissionCard({ title, description, permissions, labels = {}, fixed = false, disabled = false, onToggle }) {
  return (
    <article className="panel permission-card">
      <div className="permission-card-head">
        <h3>{title}</h3>
        {fixed && <span>Fixo</span>}
      </div>
      {description && <p>{description}</p>}
      {!fixed && (
        <div className="permission-list">
          {Object.entries(labels).map(([key, label]) => (
            <div className="permission-row" key={key}>
              <span>{label}</span>
              <ToggleSwitch checked={permissions[key]} disabled={disabled} onChange={() => onToggle(key)} label={label} />
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function UserRoleRow({ account, disabled, onChange }) {
  const roleValue = account.staffRole === 'Fundador' ? 'Fundador' : account.role === 'admin' ? 'Administrador' : 'Jogador';
  return (
    <div className="panel user-role-row">
      <div className="avatar small">{getInitials(account.nickname || account.name)}</div>
      <div className="user-role-copy">
        <strong>{account.nickname || account.name}</strong>
        <span>{account.email}</span>
      </div>
      <span className={`role-badge ${roleValue === 'Jogador' ? 'player' : 'admin'}`}>{roleValue}</span>
      <select value={roleValue} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        <option>Fundador</option>
        <option>Administrador</option>
        <option>Jogador</option>
      </select>
    </div>
  );
}

function PlayerDetail({ players, selectedPlayerId, user, notify }) {
  const player = players.find((item) => item.id === selectedPlayerId) || players[0];
  const [adminPerformance, setAdminPerformance] = useState({ loading: false, error: '', items: [] });
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    let active = true;
    if (!isAdmin || !player?.id) {
      setAdminPerformance({ loading: false, error: '', items: [] });
      return () => {
        active = false;
      };
    }

    setAdminPerformance({ loading: true, error: '', items: [] });
    fetchPlayerPerformance(player.id)
      .then((payload) => {
        if (!active) return;
        setAdminPerformance({ loading: false, error: '', items: payload.performances || [] });
      })
      .catch((error) => {
        if (!active) return;
        setAdminPerformance({ loading: false, error: error.message || 'Nao foi possivel carregar o historico individual.', items: [] });
      });

    return () => {
      active = false;
    };
  }, [isAdmin, player?.id]);

  if (!player) {
    return (
      <section>
        <SectionHeader eyebrow="Perfil oficial" title="Jogador" />
        <EmptyState icon={User} title="Nenhum jogador cadastrado." description="O card oficial aparece quando houver atleta no elenco." />
      </section>
    );
  }

  const overall = calculatePlayerOverall(player);
  const achievements = localAchievementPreview(player);
  const goalParticipation = player.stats.goals + player.stats.assists;
  const recentStreak = player.stats.matches ? `${player.stats.wins}V ${player.stats.draws || 0}E ${player.stats.losses}D` : 'Sem jogos';

  return (
    <section className="profile-layout official-player-profile">
      <div className="profile-hero official-card">
        <div className="shirt-number">#{player.shirt}</div>
        <div className="avatar big">{player.avatar}</div>
        <div>
          <span>{player.position}</span>
          <h2>{player.nickname}</h2>
          <p>{player.fullName} | Pe dominante: {player.foot || 'Nao informado'} | Status: {player.status}</p>
        </div>
        <div className="overall-badge">
          <strong>{overall}</strong>
          <span>OVR</span>
        </div>
      </div>
      <div className="stats-grid compact">
        <StatCard icon={Flag} value={player.stats.matches} label="Partidas" />
        <StatCard icon={Trophy} value={player.stats.goals} label="Gols" />
        <StatCard icon={BarChart3} value={player.stats.assists} label="Assistencias" />
        <StatCard icon={Activity} value={player.stats.recoveries} label="Roubadas" />
        <StatCard icon={Star} value={player.stats.rating} label="Nota media" />
        <StatCard icon={Sparkles} value={goalParticipation} label="Participacao em gols" />
      </div>
      <div className="matchday-grid">
        <article className="panel dashboard-panel">
          <div className="dashboard-panel-head">
            <div><span>Forma</span><h3>Radar real</h3></div>
            <small>{recentStreak}</small>
          </div>
          <ApexChart
            className="chart-box"
            options={{
              chart: { type: 'radar', toolbar: { show: false }, foreColor: '#99a4b8' },
              series: [{
                name: player.nickname,
                data: [
                  Math.min(player.stats.rating * 10, 100),
                  Math.min(player.stats.goals * 12, 100),
                  Math.min(player.stats.assists * 12, 100),
                  Math.min(player.stats.recoveries * 5, 100),
                  Math.min(player.stats.passes * 2, 100),
                ],
              }],
              labels: ['Nota', 'Gols', 'Assist.', 'Roubadas', 'Passes'],
              colors: ['#d4a24c'],
              stroke: { width: 2 },
              fill: { opacity: 0.18 },
              markers: { size: 3 },
              yaxis: { show: false, min: 0, max: 100 },
            }}
          />
        </article>
        <article className="panel dashboard-panel">
          <div className="dashboard-panel-head">
            <div><span>Clube</span><h3>Conquistas</h3></div>
          </div>
          <div className="achievement-list">
            {achievements.map((achievement) => <span key={achievement}><Trophy size={14} /> {achievement}</span>)}
            {achievements.length === 0 && <EmptyState icon={Trophy} title="Nenhuma conquista desbloqueada." description="Conquistas aparecem conforme os dados reais forem registrados." />}
          </div>
        </article>
      </div>
      {isAdmin && (
        <article className="panel dashboard-panel admin-player-history">
          <div className="dashboard-panel-head">
            <div>
              <span>Admin</span>
              <h3>Historico individual</h3>
            </div>
            <div className="performance-actions">
              <button className="button secondary small" type="button" onClick={() => downloadPerformanceReport({ playerId: player.id, format: 'pdf' }).catch((error) => notify?.(error.message))}>
                <BarChart3 size={15} />
                PDF
              </button>
              <button className="button secondary small" type="button" onClick={() => downloadPerformanceReport({ playerId: player.id, format: 'csv' }).catch((error) => notify?.(error.message))}>
                <BarChart3 size={15} />
                CSV
              </button>
            </div>
          </div>
          {adminPerformance.loading && <div className="settings-warning">Carregando historico individual...</div>}
          {adminPerformance.error && <div className="settings-warning">{adminPerformance.error}</div>}
          {!adminPerformance.loading && !adminPerformance.error && adminPerformance.items.length === 0 && (
            <EmptyState icon={Activity} title="Sem dados individuais." description="Quando este jogador registrar desempenho, o historico aparece aqui para administradores." />
          )}
          {adminPerformance.items.length > 0 && (
            <div className="performance-history">
              {adminPerformance.items.map((item) => (
                <article className="performance-history-row admin-history-row" key={item.id}>
                  <div>
                    <strong>{item.match?.away || item.match?.awayTeam || 'Partida registrada'}</strong>
                    <span>{item.match?.dateKey || item.match?.date || 'Data nao informada'} | Nota {item.rating || 0}</span>
                    {item.notes && <small>{item.notes}</small>}
                  </div>
                  <small>G {item.goals || 0} | A {item.assists || 0}</small>
                  <small>R {item.recoveries || item.ballRecoveries || 0}</small>
                </article>
              ))}
            </div>
          )}
        </article>
      )}
    </section>
  );
}

function useCountdown(match) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (!match?.dateKey) {
      setLabel('Sem partida');
      return undefined;
    }

    const update = () => {
      const target = new Date(`${match.dateKey}T${match.time || '00:00'}`);
      const diff = target.getTime() - Date.now();
      if (Number.isNaN(target.getTime())) {
        setLabel('Horario a definir');
        return;
      }
      if (diff <= 0) {
        setLabel(match.status === 'Encerrada' ? 'Partida encerrada' : 'Em andamento');
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setLabel(`${days}d ${hours}h ${minutes}min`);
    };

    update();
    const timer = window.setInterval(update, 30000);
    return () => window.clearInterval(timer);
  }, [match?.dateKey, match?.time, match?.status]);

  return label;
}

function Matchday({ user, players, setPlayers, matches, saveMatch, setView, notify, refreshClubData }) {
  const fallbackMatch = matches.find((match) => match.status === 'Em andamento')
    || matches.find((match) => match.status === 'Agendada')
    || matches[0];
  const [matchday, setMatchday] = useState({ match: fallbackMatch || null, attendances: [], lineup: null });
  const [selectedMatchId, setSelectedMatchId] = useState(fallbackMatch?.id || '');
  const [attendanceSaving, setAttendanceSaving] = useState('');
  const [lineupDraft, setLineupDraft] = useState({ formation: '4-3-3', captainId: '', players: [] });
  const [scoreDraft, setScoreDraft] = useState(fallbackMatch?.score && fallbackMatch.score !== '-' ? fallbackMatch.score : '0 x 0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === 'admin';
  const match = matches.find((item) => item.id === selectedMatchId) || matchday.match || fallbackMatch;
  const countdown = useCountdown(match);
  const ownPlayer = findPlayerForUser(user, players);
  const ownAttendance = matchday.attendances.find((item) => item.playerId === ownPlayer?.id);
  const confirmed = matchday.attendances.filter((item) => item.status === 'confirmed');
  const maybe = matchday.attendances.filter((item) => item.status === 'maybe');
  const unavailable = matchday.attendances.filter((item) => item.status === 'unavailable');

  const load = async (matchId = selectedMatchId) => {
    setLoading(true);
    try {
      if (matchId) {
        const [attendances, lineup] = await Promise.all([
          fetchMatchAttendance(matchId).catch(() => []),
          fetchMatchLineup(matchId).catch(() => null),
        ]);
        setMatchday({ match: matches.find((item) => item.id === matchId) || fallbackMatch || null, attendances, lineup });
        setLineupDraft({
          formation: lineup?.formation || '4-3-3',
          captainId: lineup?.captainId || '',
          players: [
            ...(lineup?.starters || []).map((player) => ({ playerId: player.id, role: 'starter', position: player.lineupPosition || player.position })),
            ...(lineup?.bench || []).map((player) => ({ playerId: player.id, role: 'bench', position: player.lineupPosition || player.position })),
          ],
        });
      } else {
        const payload = await fetchMatchday().catch(() => ({ match: fallbackMatch || null, attendances: [], lineup: null }));
        setMatchday(payload);
        if (payload.match?.id) setSelectedMatchId(payload.match.id);
      }
    } catch (error) {
      notify(error.message || 'Nao foi possivel carregar o Matchday.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(selectedMatchId);
  }, [selectedMatchId]);

  const updateAttendance = async (status) => {
    if (!match?.id) return;
    setAttendanceSaving(status);
    try {
      await updateMyAttendance(match.id, { status });
      await load(match.id);
      await refreshClubData?.({ silent: true });
      notify('Presenca atualizada.');
    } catch (error) {
      notify(error.message || 'Nao foi possivel atualizar presenca.');
    } finally {
      setAttendanceSaving('');
    }
  };

  const setLineupRole = (playerId, role) => {
    setLineupDraft((current) => {
      const without = current.players.filter((item) => item.playerId !== playerId);
      if (!role) return { ...current, players: without };
      const player = players.find((item) => item.id === playerId);
      return {
        ...current,
        players: [...without, { playerId, role, position: player?.position || '' }],
      };
    });
  };

  const saveLineup = async () => {
    if (!match?.id) return;
    setSaving(true);
    try {
      const lineup = await updateMatchLineup(match.id, lineupDraft);
      setMatchday((current) => ({ ...current, lineup }));
      await refreshClubData?.({ silent: true });
      notify('Escalacao salva.');
    } catch (error) {
      notify(error.message || 'Nao foi possivel salvar escalacao.');
    } finally {
      setSaving(false);
    }
  };

  const saveScore = async () => {
    if (!match?.id) return;
    setSaving(true);
    try {
      await saveMatch({ ...match, score: scoreDraft, status: 'Encerrada' }, match.id);
      await refreshClubData?.({ silent: true });
      notify('Resultado registrado. Vitoria comemorada se o placar favorecer o TorinnoFC.');
    } catch (error) {
      notify(error.message || 'Nao foi possivel salvar resultado.');
    } finally {
      setSaving(false);
    }
  };

  const generateLineupImage = () => {
    const starters = lineupDraft.players
      .filter((item) => item.role === 'starter')
      .map((item) => players.find((player) => player.id === item.playerId))
      .filter(Boolean);
    const rows = starters.map((player, index) => `<text x="40" y="${150 + index * 34}" fill="#fff7d6" font-size="20">#${player.shirt} ${player.nickname} - ${player.position}</text>`).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="#070a10"/><rect x="40" y="40" width="1000" height="1270" rx="28" fill="#111827" stroke="#d4a24c" stroke-width="4"/><text x="40" y="100" fill="#d4a24c" font-size="28">TorinnoFC Matchday</text><text x="40" y="132" fill="#ffffff" font-size="44">${match?.home || 'TorinnoFC'} x ${match?.away || 'Adversario'}</text><text x="40" y="180" fill="#99a4b8" font-size="24">Formacao ${lineupDraft.formation}</text>${rows}</svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `escalacao-${match?.away || 'matchday'}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <section>
        <SectionHeader eyebrow="Dia de jogo" title="Matchday" />
        <SkeletonGrid />
      </section>
    );
  }

  if (!match) {
    return (
      <section>
        <SectionHeader eyebrow="Dia de jogo" title="Matchday" />
        <EmptyState icon={Flag} title="Nenhuma partida cadastrada." description="Quando uma partida real for criada, o Matchday aparece aqui." />
      </section>
    );
  }

  return (
    <section className="matchday-page">
      <div className="section-title-actions">
        <SectionHeader eyebrow="Dia de jogo" title="Matchday" />
        <select value={selectedMatchId} onChange={(event) => setSelectedMatchId(event.target.value)}>
          {matches.map((item) => <option key={item.id} value={item.id}>{item.dateKey} | {item.away}</option>)}
        </select>
      </div>

      <div className={`panel matchday-hero ${match.status === 'Em andamento' ? 'live' : ''}`}>
        <div className="matchday-team">
          <img src={logo} alt="TorinnoFC" />
          <strong>{match.home}</strong>
        </div>
        <div className="matchday-score">
          <span>{match.championship}</span>
          <b>{match.score || '-'}</b>
          <small>{match.status === 'Em andamento' ? 'Ao vivo' : match.status}</small>
        </div>
        <div className="matchday-team">
          {match.opponentLogo ? <img src={match.opponentLogo} alt={match.away} /> : <div className="avatar big">{getInitials(match.away)}</div>}
          <strong>{match.away}</strong>
        </div>
      </div>

      <div className="dashboard-metrics">
        <StatCard icon={CalendarDays} value={match.dateKey} label="Data" />
        <StatCard icon={Clock} value={match.time || 'A definir'} label="Horario" />
        <StatCard icon={Flag} value={countdown} label="Contagem" />
        <StatCard icon={Users} value={confirmed.length} label="Confirmados" />
      </div>

      <div className="matchday-grid">
        <article className="panel dashboard-panel">
          <div className="dashboard-panel-head">
            <div><span>Presenca</span><h3>Minha resposta</h3></div>
          </div>
          <div className="segmented-actions">
            {[
              ['confirmed', 'Confirmado'],
              ['maybe', 'Talvez'],
              ['unavailable', 'Indisponivel'],
            ].map(([status, label]) => (
              <button
                key={status}
                className={`button ${ownAttendance?.status === status ? 'primary' : 'secondary'}`}
                type="button"
                disabled={attendanceSaving === status}
                onClick={() => updateAttendance(status)}
              >
                {attendanceSaving === status ? 'Salvando...' : label}
              </button>
            ))}
          </div>
          <div className="attendance-columns">
            <AttendanceList title="Confirmados" items={confirmed} />
            <AttendanceList title="Talvez" items={maybe} />
            <AttendanceList title="Indisponiveis" items={unavailable} />
          </div>
        </article>

        <article className="panel dashboard-panel">
          <div className="dashboard-panel-head">
            <div><span>Escalacao</span><h3>{lineupDraft.formation}</h3></div>
            <button className="action-link" type="button" onClick={generateLineupImage}>Gerar imagem</button>
          </div>
          <LineupList title="Titulares" players={matchday.lineup?.starters || []} captainId={matchday.lineup?.captainId} />
          <LineupList title="Reservas" players={matchday.lineup?.bench || []} captainId={matchday.lineup?.captainId} />
          {!matchday.lineup && <EmptyState icon={Users} title="Escalacao ainda nao definida." description="Somente administradores podem montar a escalacao." />}
        </article>
      </div>

      {isAdmin && (
        <div className="panel dashboard-panel">
          <div className="dashboard-panel-head">
            <div><span>Admin</span><h3>Montar Matchday</h3></div>
          </div>
          <div className="form-grid">
            <Field label="Formacao" value={lineupDraft.formation} onChange={(formation) => setLineupDraft({ ...lineupDraft, formation })} />
            <Field label="Placar" value={scoreDraft} onChange={setScoreDraft} />
          </div>
          <label className="field">
            <span>Capitao</span>
            <select value={lineupDraft.captainId} onChange={(event) => setLineupDraft({ ...lineupDraft, captainId: event.target.value })}>
              <option value="">Sem capitao</option>
              {players.map((player) => <option key={player.id} value={player.id}>{player.nickname}</option>)}
            </select>
          </label>
          <div className="lineup-editor">
            {players.map((player) => {
              const entry = lineupDraft.players.find((item) => item.playerId === player.id);
              return (
                <div className="lineup-editor-row" key={player.id}>
                  <span>#{player.shirt} {player.nickname}</span>
                  <select value={entry?.role || ''} onChange={(event) => setLineupRole(player.id, event.target.value)}>
                    <option value="">Fora</option>
                    <option value="starter">Titular</option>
                    <option value="bench">Reserva</option>
                  </select>
                </div>
              );
            })}
          </div>
          <div className="modal-actions">
            <button className="button primary" type="button" disabled={saving} onClick={saveLineup}>Salvar escalacao</button>
            <button className="button secondary" type="button" disabled={saving} onClick={saveScore}>Atualizar resultado</button>
          </div>
        </div>
      )}

      {match.status === 'Encerrada' && (
        <div className="panel dashboard-panel">
          <div className="dashboard-panel-head">
            <div><span>Final</span><h3>Resumo da partida</h3></div>
            <button className="action-link" type="button" onClick={() => setView('performance')}>Registrar desempenho</button>
          </div>
          <p className="settings-warning">{match.observations || 'Resultado final salvo. Registre abaixo os dados reais da partida para atualizar o painel.'}</p>
          {isAdmin && (
            <MatchStatsRecorder
              match={match}
              players={players}
              setPlayers={setPlayers}
              notify={notify}
              refreshClubData={refreshClubData}
            />
          )}
        </div>
      )}
    </section>
  );
}

function AttendanceList({ title, items }) {
  return (
    <div>
      <strong>{title}</strong>
      {items.map((item) => <span key={item.id}>{item.player?.nickname || 'Jogador'}</span>)}
      {items.length === 0 && <small>Ninguem ainda.</small>}
    </div>
  );
}

function LineupList({ title, players, captainId }) {
  if (!players.length) return null;
  return (
    <div className="lineup-list">
      <strong>{title}</strong>
      {players.map((player) => (
        <span key={player.id}>#{player.shirt} {player.nickname}{captainId === player.id ? ' | Capitao' : ''}</span>
      ))}
    </div>
  );
}

function MatchCard({ user, match, players, setPlayers, saveMatch, notify, refreshClubData }) {
  const normalized = normalizeMatchEvent(match);
  const [showStats, setShowStats] = useState(false);
  const isAdmin = user?.role === 'admin';
  const nextStatus = async () => {
    const currentIndex = statusFlow.indexOf(normalized.status);
    const status = statusFlow[(currentIndex + 1) % statusFlow.length];
    try {
      await saveMatch(
        { ...normalized, status, score: status === 'Encerrada' && normalized.score === '-' ? '0 x 0' : normalized.score },
        normalized.id,
      );
      notify(`Status atualizado para ${status}.`);
    } catch (error) {
      notify(error.message || 'Nao foi possivel atualizar o status.');
    }
  };

  return (
    <article className="match-card">
      <div className="match-logos" aria-hidden="true">
        <img src={normalized.homeLogo} alt="" />
        <img src={normalized.opponentLogo} alt="" />
      </div>
      <div>
        <span>
          {normalized.date} | {normalized.time}
        </span>
        <strong>
          {normalized.home} <em>x</em> {normalized.away}
        </strong>
        <small>
          {normalized.place} | {normalized.championship}
        </small>
      </div>
      <div className="score">{normalized.score}</div>
      <div className="match-card-actions">
        <button className={`status ${normalized.status === 'Em andamento' ? 'live' : ''}`} type="button" onClick={nextStatus}>
          {normalized.status}
        </button>
        {isAdmin && normalized.status === 'Encerrada' && (
          <button
            className="button secondary small"
            type="button"
            onClick={() => setShowStats((current) => !current)}
          >
            <BarChart3 size={14} />
            Dados
          </button>
        )}
      </div>
      {showStats && isAdmin && normalized.status === 'Encerrada' && (
        <div className="match-card-stats">
          <MatchStatsRecorder
            match={normalized}
            players={players}
            setPlayers={setPlayers}
            notify={notify}
            refreshClubData={refreshClubData}
          />
        </div>
      )}
    </article>
  );
}

function TopRanking({ players }) {
  return (
    <div className="panel">
      <h3>Top 3 ranking</h3>
      {players.slice(0, 3).map((player, index) => (
        <div className="top-row" key={player.id}>
          <span>#{index + 1}</span>
          <div className="avatar small">{player.avatar}</div>
          <strong>{player.nickname}</strong>
          <b>{player.stats.rating}</b>
        </div>
      ))}
      {players.length === 0 && <div className="empty-state">Nenhum jogador cadastrado no elenco.</div>}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="skeleton-grid" aria-busy="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="skeleton-card" key={index} />
      ))}
    </div>
  );
}

function CelebrationBurst() {
  return (
    <div className="celebration-burst" aria-hidden="true">
      {Array.from({ length: 10 }).map((_, index) => <i key={index} />)}
    </div>
  );
}

function Toast({ message }) {
  return (
    <div className="toast" role="status">
      <CheckCircle2 size={16} />
      {message}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="empty-state-card">
      <div className="icon-tile blue">
        <Icon size={16} />
      </div>
      <div>
        <strong>{title}</strong>
        {description && <span>{description}</span>}
      </div>
      {action && (
        <button className="button minimal small" type="button" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

function useAnimatedNumber(value) {
  const numeric = typeof value === 'number' ? value : (/^\d+(\.\d+)?$/.test(String(value)) ? Number(value) : null);
  const [display, setDisplay] = useState(numeric ?? value);

  useEffect(() => {
    if (numeric === null) {
      setDisplay(value);
      return undefined;
    }

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setDisplay(value);
      return undefined;
    }

    let frame = 0;
    const frames = 28;
    const start = 0;
    const timer = window.setInterval(() => {
      frame += 1;
      const progress = Math.min(frame / frames, 1);
      const eased = 1 - (1 - progress) ** 3;
      const next = start + (numeric - start) * eased;
      setDisplay(Number.isInteger(numeric) ? Math.round(next) : next.toFixed(1));
      if (progress === 1) window.clearInterval(timer);
    }, 18);

    return () => window.clearInterval(timer);
  }, [numeric, value]);

  return display;
}

function StatCard({ icon: Icon, value, label }) {
  const displayValue = useAnimatedNumber(value);
  return (
    <article className="stat-card">
      <div className="icon-tile gold">
        <Icon size={16} />
      </div>
      <strong>{displayValue}</strong>
      <span>{label}</span>
    </article>
  );
}

function SectionHeader({ eyebrow, title }) {
  return (
    <div className="section-header">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '', required = false, autoComplete }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} required={required} autoComplete={autoComplete} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function getInitials(value = 'TF') {
  return value
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDateLabel(value) {
  if (!value) {
    return 'Data a definir';
  }

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR');
}

function getEventType(match) {
  const label = `${match.championship || ''} ${match.type || ''}`.toLowerCase();

  if (label.includes('treino')) return 'Treino';
  if (label.includes('peneira') || label.includes('teste')) return 'Peneira';
  if (label.includes('interno')) return 'Interno';
  return 'Partida';
}

function getEventStatus(match) {
  if (match.status === 'Agendada') return 'Agendada';
  if (match.status === 'Confirmada') return 'Confirmada';
  if (match.status === 'Em andamento') return 'Em andamento';
  if (match.status === 'Encerrada') return 'Finalizada';
  if (match.status === 'Cancelada') return 'Cancelada';
  if (match.status === 'Pendente') return 'Pendente';
  return 'Confirmada';
}

function isDuplicateMatch(matches, nextMatch) {
  return matches.some(
    (match) =>
      match.dateKey === nextMatch.dateKey
      && match.time === nextMatch.time
      && match.away?.trim().toLowerCase() === nextMatch.away?.trim().toLowerCase(),
  );
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidEmail(value) {
  const email = normalizeEmail(value);
  if (!email || email.length > 254 || email.includes('..')) return false;

  const parts = email.split('@');
  if (parts.length !== 2) return false;

  const [local, domain] = parts;
  if (!local || !domain || !domain.includes('.')) return false;
  if (local.startsWith('.') || local.endsWith('.')) return false;

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function authErrorMessage(error, fallback) {
  const message = String(error?.message || '');
  const code = String(error?.code || error?.name || '');
  const raw = `${code} ${message}`.toLowerCase();

  if (raw.includes('already') || raw.includes('exists') || raw.includes('registered')) {
    return 'Este e-mail ja esta cadastrado. Faca login ou recupere a senha.';
  }
  if (raw.includes('weak') || raw.includes('password')) {
    return message || 'A senha nao atende as regras de seguranca.';
  }
  if (raw.includes('rate') || raw.includes('too many')) {
    return 'Muitas tentativas seguidas. Aguarde um pouco e tente novamente.';
  }
  if (raw.includes('signup') && (raw.includes('disabled') || raw.includes('not allowed'))) {
    return 'O cadastro esta desativado no provedor de login.';
  }
  if (raw.includes('email_not_confirmed') || raw.includes('email not confirmed')) {
    return 'Confirme seu e-mail pelo link enviado antes de entrar.';
  }
  if (raw.includes('invalid') && raw.includes('email')) {
    return 'O e-mail informado nao e valido. Confira o endereco completo.';
  }

  return fallback;
}

function toMatchPayload(match) {
  const [homeScore, awayScore] = String(match.score || '')
    .split('x')
    .map((value) => Number(value.trim()));

  return {
    home_team: match.home || 'TorinnoFC',
    away_team: match.away,
    opponent_logo_url: match.opponentLogo || '',
    whatsapp_url: match.whatsappUrl || '',
    match_date: match.dateKey,
    match_time: match.time,
    location: match.place || 'EA FC 26 | Clubs',
    championship_id: match.championshipId || '',
    championship_name: match.championship || '',
    status: match.status || 'Agendada',
    observations: match.observations || '',
    home_score: Number.isFinite(homeScore) ? homeScore : '',
    away_score: Number.isFinite(awayScore) ? awayScore : '',
  };
}

function championshipStatusLabel(status) {
  const labels = {
    futuro: 'Futuro',
    em_andamento: 'Em andamento',
    encerrado: 'Encerrado',
    Preparacao: 'Futuro',
    'Em andamento': 'Em andamento',
    Encerrado: 'Encerrado',
  };

  return labels[status] || 'Futuro';
}

function notificationCategory(type = '') {
  if (type.includes('tryout')) return 'tryout';
  if (type.includes('championship')) return 'championship';
  if (type.includes('member')) return 'member';
  if (type.includes('statistics')) return 'statistics';
  if (type.includes('role') || type.includes('admin')) return 'admin';
  return 'match';
}

function notificationIcon(type = '') {
  if (type.includes('tryout')) return UserPlus;
  if (type.includes('championship')) return Trophy;
  if (type.includes('member')) return UserPlus;
  if (type.includes('statistics')) return BarChart3;
  if (type.includes('role') || type.includes('admin')) return ShieldCheck;
  if (type.includes('reminder')) return Clock;
  return CalendarDays;
}

function formatDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function groupNotificationsByDate(items) {
  const today = toDateKey(new Date());
  const yesterday = toDateKey(addDays(new Date(), -1));
  const weekAgo = toDateKey(addDays(new Date(), -7));

  return items.reduce((groups, item) => {
    const key = toDateKey(new Date(item.createdAt));
    let group = 'Mais antigas';
    if (key === today) group = 'Hoje';
    else if (key === yesterday) group = 'Ontem';
    else if (key >= weekAgo) group = 'Esta semana';
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
}

function navigateFromNotification(notification, setView) {
  const action = notification.actionUrl || '';
  if (action.includes('championship')) setView('championships');
  else if (action.includes('players')) setView('players');
  else if (action.includes('performance')) setView('performance');
  else if (action.includes('settings')) setView('settings');
  else setView('calendar');
}

function isValidShirtNumber(value) {
  const shirt = Number(value);
  return Number.isInteger(shirt) && shirt > 0 && shirt <= 999;
}

function pageTitle(view) {
  const map = {
    dashboard: 'Painel',
    profile: 'Meu Perfil',
    performance: 'Meu Desempenho',
    players: 'Jogadores',
    'player-detail': 'Perfil do Jogador',
    tryouts: 'Peneiras',
    matches: 'Partidas',
    matchday: 'Matchday',
    calendar: 'Calendario',
    notifications: 'Notificacoes',
    ranking: 'Ranking',
    compare: 'Comparar jogadores',
    team: 'Time',
    championships: 'Campeonatos',
    admin: 'Admin',
    settings: 'Configuracoes',
    logout: 'Sair da conta',
  };
  return map[view] || 'Painel';
}

export default App;
