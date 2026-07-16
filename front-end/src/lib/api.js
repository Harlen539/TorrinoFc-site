import { hasSupabaseConfig, supabase } from './supabaseClient.js';

const API_BASE_URL = (import.meta.env.VITE_ADMIN_API_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY || '';

async function request(path, { method = 'GET', body, admin = false, userEmail = '' } = {}) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (admin && ADMIN_API_KEY) {
    headers['x-admin-api-key'] = ADMIN_API_KEY;
  }

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
    const message = payload.error || payload.errors?.join(' ') || 'Nao foi possivel concluir a operacao.';
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
  return request('/api/players', { method: 'POST', body: payload, admin: true }).then((data) => data.player);
}

export function updatePlayer(id, payload) {
  return request(`/api/players/${id}`, { method: 'PUT', body: payload, admin: true }).then((data) => data.player);
}

export function updatePlayerStats(id, payload) {
  return request(`/api/players/${id}/stats`, { method: 'PUT', body: payload, admin: true }).then((data) => data.player);
}

export function deletePlayer(id) {
  return request(`/api/players/${id}`, { method: 'DELETE', admin: true });
}

export function fetchTryouts() {
  return request('/api/tryouts').then((payload) => payload.tryouts || []);
}

export function createTryout(payload) {
  return request('/api/tryouts', { method: 'POST', body: payload, admin: true }).then((data) => data.tryout);
}

export function updateTryout(id, payload) {
  return request(`/api/tryouts/${id}`, { method: 'PUT', body: payload, admin: true }).then((data) => data.tryout);
}

export function updateTryoutStatus(id, status) {
  return request(`/api/tryouts/${id}/status`, { method: 'PATCH', body: { status }, admin: true }).then((data) => data.tryout);
}

export function deleteTryout(id) {
  return request(`/api/tryouts/${id}`, { method: 'DELETE', admin: true });
}

export function createMatch(payload) {
  return request('/api/matches', { method: 'POST', body: payload, admin: true }).then((data) => data.match);
}

export function updateMatch(id, payload) {
  return request(`/api/matches/${id}`, { method: 'PUT', body: payload, admin: true }).then((data) => data.match);
}

export function deleteMatch(id) {
  return request(`/api/matches/${id}`, { method: 'DELETE', admin: true });
}

export function fetchChampionships() {
  return request('/api/championships').then((payload) => payload.championships || []);
}

export function createChampionship(payload) {
  return request('/api/championships', { method: 'POST', body: payload, admin: true }).then((data) => data.championship);
}

export function updateChampionship(id, payload) {
  return request(`/api/championships/${id}`, { method: 'PUT', body: payload, admin: true }).then((data) => data.championship);
}

export function deleteChampionship(id) {
  return request(`/api/championships/${id}`, { method: 'DELETE', admin: true });
}

export function syncUser(payload) {
  return request('/api/users/sync', { method: 'POST', body: payload, admin: true }).then((data) => data.user);
}

export function fetchUsers() {
  return request('/api/users').then((data) => data.users || []);
}

export function updateUserRole(id, role) {
  return request(`/api/users/${id}/role`, { method: 'PATCH', body: { role }, admin: true }).then((data) => data.user);
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
