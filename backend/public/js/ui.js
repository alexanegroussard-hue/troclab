/**
 * TrocLab — Utilitaires UI
 * Toast, modal, helpers de rendu
 */

// =============================================
// TOAST NOTIFICATIONS
// =============================================
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'default', duration = 3500) {
    if (!this.container) this.init();
    const icons = { success: '✓', error: '✕', warning: '⚠', default: '●' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span>${icons[type] || icons.default}</span> ${message}`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'toast-in 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success: (msg) => Toast.show(msg, 'success'),
  error: (msg) => Toast.show(msg, 'error'),
  warning: (msg) => Toast.show(msg, 'warning'),
  info: (msg) => Toast.show(msg, 'default'),
};

// =============================================
// MODAL
// =============================================
const Modal = {
  show(title, contentHTML, footerHTML = '') {
    const existing = document.getElementById('global-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'global-modal';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal__header">
          <h3>${title}</h3>
          <button class="modal__close" onclick="Modal.close()">✕</button>
        </div>
        <div class="modal__body">${contentHTML}</div>
        ${footerHTML ? `<div class="modal__footer mt-lg">${footerHTML}</div>` : ''}
      </div>
    `;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) Modal.close(); });
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  },

  close() {
    const m = document.getElementById('global-modal');
    if (m) { m.remove(); document.body.style.overflow = ''; }
  }
};

// =============================================
// HELPERS DE RENDU
// =============================================

function avatarInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function avatarHTML(user, size = 'md') {
  const initials = avatarInitials(user.name || user.user_name || '?');
  const color = user.avatar_color || user.sender_color || '#2D6A4F';
  return `<div class="avatar avatar--${size}" style="background:${color}">${initials}</div>`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'à l\'instant';
  if (diff < 3600000) return `${Math.floor(diff/60000)}min`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h`;
  if (diff < 604800000) return `${Math.floor(diff/86400000)}j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function orgTypeLabel(type) {
  const labels = {
    fablab: 'FabLab', association: 'Association', coop: 'Coopérative',
    'tiers-lieu': 'Tiers-lieu', ess: 'Structure ESS', autre: 'Autre'
  };
  return labels[type] || type || 'Organisation';
}

function formationTypeHTML(type) {
  if (type === 'offered') return `<span class="formation-badge badge--offered">Proposée</span>`;
  return `<span class="formation-badge badge--wanted">Recherchée</span>`;
}

function exchangeStatusLabel(status) {
  const s = {
    pending: { label: 'En attente', color: '#B08000', bg: '#FFF8E1' },
    accepted: { label: 'Accepté', color: '#2D6A4F', bg: '#D8F3DC' },
    refused: { label: 'Refusé', color: '#7A1F1F', bg: '#FFE8E8' },
    completed: { label: 'Complété ✓', color: '#2D6A4F', bg: '#D8F3DC' },
    cancelled: { label: 'Annulé', color: '#888', bg: '#F0F0F0' },
  };
  const style = s[status] || s.pending;
  return `<span style="font-family:var(--font-ui);font-size:0.78rem;font-weight:600;padding:3px 10px;border-radius:9999px;background:${style.bg};color:${style.color}">${style.label}</span>`;
}

function formationCardHTML(f, showActions = false, currentUserId = null) {
  const isOwn = f.user_id === currentUserId;
  return `
    <div class="card card--formation" style="gap:var(--space-sm)">
      <div class="flex items-center justify-between gap-md">
        ${formationTypeHTML(f.type)}
        <span class="category-tag">${f.category}</span>
      </div>
      <div>
        <h4 style="margin-bottom:6px">${escapeHtml(f.title)}</h4>
        <p class="text-small text-muted" style="line-height:1.5">${escapeHtml(f.description)}</p>
      </div>
      <div class="flex gap-md text-small text-muted font-ui" style="flex-wrap:wrap">
        <span>⏱ ${f.duration_hours}h</span>
        <span>👥 ${f.max_participants} pers. max</span>
        ${f.city ? `<span>📍 ${escapeHtml(f.city)}</span>` : ''}
      </div>
${f.user_name ? `
  <div style="padding-top:10px;border-top:1px solid var(--color-border);display:flex;align-items:center;gap:8px;min-width:0">
    <div class="avatar avatar--sm" style="background:${f.avatar_color||'#2D6A4F'};flex-shrink:0">${avatarInitials(f.user_name)}</div>
    <div style="min-width:0;flex:1;overflow:hidden">
      <div class="font-ui text-small" style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(f.organisation||'')}</div>
      <div class="font-ui" style="font-size:0.75rem;color:var(--color-text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(f.user_name)}</div>
    </div>
${!isOwn ? `
      <button onclick="openMessageCompose('${f.user_id}','${escapeHtml(f.user_name)}')"
        class="btn btn--primary btn--sm" style="flex-shrink:0;margin-left:auto">Message</button>
    ` : ''}
  </div>
` : ''}
      ${showActions && isOwn ? `
        <div class="flex gap-sm" style="padding-top:8px;border-top:1px solid var(--color-border)">
          <button onclick="editFormation('${f.id}')" class="btn btn--ghost btn--sm">Modifier</button>
          <button onclick="deleteFormation('${f.id}')" class="btn btn--danger btn--sm">Supprimer</button>
        </div>
      ` : ''}
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// =============================================
// NAVBAR ACTIVE STATE & UNREAD BADGE
// =============================================
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href !== '/' && path.startsWith(href)) link.classList.add('active');
    else if (href === '/' && path === '/') link.classList.add('active');
    else link.classList.remove('active');
  });
}

async function refreshUnreadBadge() {
  if (!Session.isLoggedIn()) return;
  try {
    const { count } = await Messages.unreadCount();
    const badge = document.getElementById('msg-badge');
    if (badge) {
      badge.textContent = count;
      badge.classList.toggle('hidden', count === 0);
    }
  } catch {}
}
