import { hasSupabaseConfig, supabase } from './supabaseClient.js';

const productionApiUrl = 'https://torrinofc-site.onrender.com';
const localApiUrl = 'http://127.0.0.1:4000';
const API_BASE_URL = (
  import.meta.env.VITE_API_URL
  || import.meta.env.VITE_ADMIN_API_URL
  || (import.meta.env.PROD ? productionApiUrl : localApiUrl)
).replace(/\/$/, '');

async function request(path, { method = 'GET', body, userEmail = '' } = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (hasSupabaseConfig) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    if (!userEmail && data.session?.user?.email) {
      userEmail = data.session.user.email;
    }
  }

  if (!userEmail) {
    try {
      const savedSession = JSON.parse(localStorage.getItem('torinnofc-session') || '{}');
      userEmail = savedSession.email || '';
    } catch {
      userEmail = '';
    }
  }

  if (userEmail) {
    headers['x-user-email'] = String(userEmail).trim().toLowerCase();
  }

  const options = {
    method,
    headers,
  };

  if (body !== undefined && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options);

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const fallbackMessage = response.status >= 500
      ? 'O servidor retornou erro 500. Verifique as variaveis DATABASE_URL/DIRECT_URL e rode as migrations do banco no Render.'
      : 'Nao foi possivel concluir a operacao.';
    const message = payload.error || payload.errors?.join(' ') || fallbackMessage;
    throw new Error(message);
  }

  return payload;
}

export function fetchMatches() {
  return request('/api/matches').then((payload) => payload.matches || []);
}

export function fetchPlayers() {
  return request('/api/players').then((payload) => payload.players || []);
}

export function createPlayer(payload) {
  return request('/api/players', { method: 'POST', body: payload }).then((data) => data.player);
}

export function updatePlayer(id, payload) {
  return request(`/api/players/${id}`, { method: 'PUT', body: payload }).then((data) => data.player);
}

export function updatePlayerStats(id, payload) {
  return request(`/api/players/${id}/stats`, { method: 'PUT', body: payload }).then((data) => data.player);
}

export function deletePlayer(id) {
  return request(`/api/players/${id}`, { method: 'DELETE' });
}

export function fetchTryouts() {
  return request('/api/tryouts').then((payload) => payload.tryouts || []);
}

export function createTryout(payload) {
  return request('/api/tryouts', { method: 'POST', body: payload }).then((data) => data.tryout);
}

export function updateTryout(id, payload) {
  return request(`/api/tryouts/${id}`, { method: 'PUT', body: payload }).then((data) => data.tryout);
}

export function updateTryoutStatus(id, status) {
  return request(`/api/tryouts/${id}/status`, { method: 'PATCH', body: { status } }).then((data) => data.tryout);
}

export function deleteTryout(id) {
  return request(`/api/tryouts/${id}`, { method: 'DELETE' });
}

export function createMatch(payload) {
  return request('/api/matches', { method: 'POST', body: payload }).then((data) => data.match);
}

export function updateMatch(id, payload) {
  return request(`/api/matches/${id}`, { method: 'PUT', body: payload }).then((data) => data.match);
}

export function deleteMatch(id) {
  return request(`/api/matches/${id}`, { method: 'DELETE' });
}

export function fetchChampionships() {
  return request('/api/championships').then((payload) => payload.championships || []);
}

export function createChampionship(payload) {
  return request('/api/championships', { method: 'POST', body: payload }).then((data) => data.championship);
}

export function updateChampionship(id, payload) {
  return request(`/api/championships/${id}`, { method: 'PUT', body: payload }).then((data) => data.championship);
}

export function deleteChampionship(id) {
  return request(`/api/championships/${id}`, { method: 'DELETE' });
}

export function syncUser(payload) {
  return request('/api/users/sync', { method: 'POST', body: payload }).then((data) => ({
    ...data.user,
    player: data.player,
    playerId: data.playerId || data.user?.playerId || '',
    role: data.role || data.user?.role,
    staffRole: data.staffRole || data.user?.staffRole,
  }));
}

export function fetchUsers() {
  return request('/api/users').then((data) => data.users || []);
}

export function updateUserRole(id, role) {
  return request(`/api/users/${id}/role`, { method: 'PATCH', body: { role } }).then((data) => data.user);
}

export function fetchMyPerformance() {
  return request('/api/me/performance');
}

export function createMyPerformance(payload) {
  return request('/api/me/performance', { method: 'POST', body: payload });
}

export function updateMyPerformance(id, payload) {
  return request(`/api/me/performance/${id}`, { method: 'PUT', body: payload });
}

export function deleteMyPerformance(id) {
  return request(`/api/me/performance/${id}`, { method: 'DELETE' });
}

export function fetchPlayerPerformance(playerId) {
  return request(`/api/players/${playerId}/performance`);
}

export function createPlayerPerformance(playerId, payload) {
  return request(`/api/players/${playerId}/performance`, { method: 'POST', body: payload });
}

export function updatePlayerPerformance(playerId, performanceId, payload) {
  return request(`/api/players/${playerId}/performance/${performanceId}`, { method: 'PUT', body: payload });
}

export function deletePlayerPerformance(playerId, performanceId) {
  return request(`/api/players/${playerId}/performance/${performanceId}`, { method: 'DELETE' });
}

export function fetchMySettings() {
  return request('/api/settings/me').then((data) => data.settings);
}

export function updateMySettings(settings) {
  return request('/api/settings/me', { method: 'PUT', body: settings }).then((data) => data.settings);
}

export function fetchClubSettings() {
  return request('/api/admin/settings').then((data) => data.settings);
}

export function updateClubSettings(settings) {
  return request('/api/admin/settings', { method: 'PUT', body: settings }).then((data) => data.settings);
}

export function fetchRolePermissions() {
  return request('/api/admin/permissions').then((data) => data.permissions);
}

export function updateRolePermission(role, permission, enabled) {
  return request(`/api/admin/permissions/${role}/${permission}`, {
    method: 'PUT',
    body: { enabled },
  }).then((data) => data.permissions);
}

export async function downloadPerformanceReport({ playerId = '', format = 'pdf' } = {}) {
  const headers = {};
  if (hasSupabaseConfig) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const path = playerId
    ? `/api/players/${playerId}/performance/report?format=${encodeURIComponent(format)}`
    : `/api/me/performance/report?format=${encodeURIComponent(format)}`;
  const response = await fetch(`${API_BASE_URL}${path}`, { headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Nao foi possivel baixar o relatorio.');
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const fileName = disposition.match(/filename="([^"]+)"/)?.[1] || `relatorio-desempenho.${format}`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function fetchNotifications(userEmail, { limit = 40, unread = false, type = '' } = {}) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (unread) params.set('unread', 'true');
  if (type) params.set('type', type);
  return request(`/api/notifications?${params.toString()}`, { userEmail }).then((data) => data);
}

export function markNotificationRead(id, userEmail, isRead = true) {
  return request(`/api/notifications/${id}/read`, {
    method: 'PATCH',
    body: { is_read: isRead },
    userEmail,
  });
}

export function markAllNotificationsRead(userEmail) {
  return request('/api/notifications/read-all', {
    method: 'PATCH',
    body: {},
    userEmail,
  });
}

export function deleteNotification(id, userEmail) {
  return request(`/api/notifications/${id}`, {
    method: 'DELETE',
    userEmail,
  });
}

export function fetchNotificationPreferences(userEmail) {
  return request('/api/notification-preferences', { userEmail }).then((data) => data.preferences);
}

export function updateNotificationPreferences(userEmail, preferences) {
  return request('/api/notification-preferences', {
    method: 'PUT',
    body: preferences,
    userEmail,
  }).then((data) => data.preferences);
}

export function fetchActivities({ limit = 20 } = {}) {
  return request(`/api/activities?limit=${encodeURIComponent(limit)}`).then((data) => data.activities || []);
}

export function fetchAchievements() {
  return request('/api/achievements').then((data) => data.achievements || []);
}

export function fetchPlayerAchievements(playerId) {
  return request(`/api/players/${playerId}/achievements`).then((data) => data.achievements || []);
}

export function fetchMatchday() {
  return request('/api/matchday');
}

export function fetchMatchAttendance(matchId) {
  return request(`/api/matches/${matchId}/attendance`).then((data) => data.attendances || []);
}

export function updateMyAttendance(matchId, payload) {
  return request(`/api/matches/${matchId}/attendance/me`, {
    method: 'PUT',
    body: payload,
  }).then((data) => data.attendance);
}

export function updateMatchAttendance(matchId, playerId, payload) {
  return request(`/api/matches/${matchId}/attendance/${playerId}`, {
    method: 'PUT',
    body: payload,
  }).then((data) => data.attendance);
}

export function fetchMatchLineup(matchId) {
  return request(`/api/matches/${matchId}/lineup`).then((data) => data.lineup);
}

export function updateMatchLineup(matchId, payload) {
  return request(`/api/matches/${matchId}/lineup`, {
    method: 'PUT',
    body: payload,
  }).then((data) => data.lineup);
}
