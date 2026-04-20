/**
 * TrocLab — Client API
 * Toutes les requêtes vers le backend passent par ce module.
 */

const API_BASE = '/api';

// ---- Auth token ----
function getToken() { return localStorage.getItem('troclab_token'); }
function setToken(t) { localStorage.setItem('troclab_token', t); }
function clearToken() { localStorage.removeItem('troclab_token'); localStorage.removeItem('troclab_user'); }

function authHeaders() {
  const t = getToken();
  return t ? { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function request(method, path, body = null) {
  const opts = { method, headers: authHeaders() };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw { status: res.status, message: data.error || data.message || 'Erreur inconnue', data };
  return data;
}

// ---- Auth ----
const Auth = {
  register: (payload) => request('POST', '/auth/register', payload),
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  me: () => request('GET', '/auth/me'),
  logout() { clearToken(); window.location.href = '/'; }
};

// ---- Users ----
const Users = {
  list: () => request('GET', '/users'),
  get: (id) => request('GET', `/users/${id}`),
  updateMe: (payload) => request('PUT', '/users/me', payload),
};

// ---- Formations ----
const Formations = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', '/formations' + (q ? `?${q}` : ''));
  },
  mine: () => request('GET', '/formations/mine'),
  create: (payload) => request('POST', '/formations', payload),
  update: (id, payload) => request('PUT', `/formations/${id}`, payload),
  delete: (id) => request('DELETE', `/formations/${id}`),
};

// ---- Exchanges ----
const Exchanges = {
  list: () => request('GET', '/exchanges'),
  create: (payload) => request('POST', '/exchanges', payload),
  updateStatus: (id, status) => request('PUT', `/exchanges/${id}/status`, { status }),
};

// ---- Messages ----
const Messages = {
  inbox: () => request('GET', '/messages'),
  sent: () => request('GET', '/messages/sent'),
  unreadCount: () => request('GET', '/messages/unread-count'),
  send: (payload) => request('POST', '/messages', payload),
  markRead: (id) => request('PUT', `/messages/${id}/read`),
};

// ---- Session utilisateur ----
const Session = {
  save(token, user) { setToken(token); localStorage.setItem('troclab_user', JSON.stringify(user)); },
  getUser() {
    try { return JSON.parse(localStorage.getItem('troclab_user')); } catch { return null; }
  },
  isLoggedIn() { return !!getToken(); },
  clear() { clearToken(); }
};
