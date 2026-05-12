/**
 * TrocLab — Application SPA
 * Routeur client-side + rendu des pages
 */

// =============================================
// ROUTEUR
// =============================================
const routes = {
  '/':                  renderHome,
  '/catalogue':         renderCatalogue,
  '/carte':             renderCarte,
  '/about':             renderAbout,
  '/connexion':         renderLogin,
  '/inscription':       renderRegister,
  '/tableau-de-bord':   renderDashboard,
  '/messages':          renderMessages,
  '/alertes':           renderAlertes,
  '/profil/:id':        renderProfil,
  '/formation/:id': renderFormation,
};

function navigate(path) {
  history.pushState({}, '', path);
  renderPage(path);
  window.scrollTo(0, 0);
}

function renderPage(path) {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="page-loader"><div class="spinner"></div></div>`;

  // Trouver la route
  let handler = null;
  let params = {};

  for (const [pattern, fn] of Object.entries(routes)) {
    if (pattern.includes(':')) {
      const regex = new RegExp('^' + pattern.replace(/:([^/]+)/g, '([^/]+)') + '$');
      const match = path.match(regex);
      if (match) {
        const keys = [...pattern.matchAll(/:([^/]+)/g)].map(m => m[1]);
        keys.forEach((k, i) => params[k] = match[i + 1]);
        handler = fn;
        break;
      }
    } else if (pattern === path) {
      handler = fn;
      break;
    }
  }

  if (!handler) { app.innerHTML = render404(); return; }

  // Protéger les pages privées
  const privatePages = ['/tableau-de-bord', '/messages'];
  if (privatePages.includes(path) && !Session.isLoggedIn()) {
    navigate('/connexion');
    return;
  }

  handler(app, params);
  setActiveNav();
  refreshUnreadBadge();
}

window.addEventListener('popstate', () => renderPage(window.location.pathname));

// Intercepter les clics sur les liens internes
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (href.startsWith('/') && !href.startsWith('//') && !href.startsWith('/api')) {
    e.preventDefault();
    navigate(href);
  }
});

// =============================================
// NAVBAR
// =============================================
function renderNav() {
  const nav = document.getElementById('nav-links');
  const user = Session.getUser();
  const footerLogin = document.getElementById('footer-login-link');
  const footerDash = document.getElementById('footer-dash-link');

  if (user) {
    nav.innerHTML = `
      <a href="/about" class="nav-link">À propos</a>
      <a href="/catalogue" class="nav-link">Formations</a>
      <a href="/carte" class="nav-link">Carte</a>
      <a href="/messages" class="nav-link">
        Messages <span class="navbar__badge hidden" id="msg-badge">0</span>
      </a>
      <a href="/tableau-de-bord" class="nav-link">Mon espace</a>
    `;
    if (footerLogin) footerLogin.classList.add('hidden');
    if (footerDash) footerDash.classList.remove('hidden');
  } else {
    nav.innerHTML = `
      <a href="/catalogue" class="nav-link">Formations</a>
      <a href="/carte" class="nav-link">Carte</a>
      <a href="/about" class="nav-link">À propos</a>
      <a href="/connexion" class="btn btn--ghost btn--sm">Connexion</a>
      <a href="/inscription" class="btn btn--primary btn--sm">Rejoindre</a>
    `;
    if (footerLogin) footerLogin.classList.remove('hidden');
    if (footerDash) footerDash.classList.add('hidden');
  }
  setActiveNav();
  refreshUnreadBadge();
}

// =============================================
// PAGE : ACCUEIL
// =============================================
async function renderHome(app) {
  const user = Session.getUser();
  app.innerHTML = `
    <!-- HERO -->
    <section class="hero">
      <div class="container">
        <div class="hero__content">
          <div class="hero__eyebrow">Plateforme de réciprocité</div>
          <h1>Faciliter les échanges de compétences<br><em>facilement et à moindre coût ?</em></h1>
          <p class="hero__sub">
            C'est l'objectif de Troclab.<br>
            TrocLab connecte les associations, coopératives, fablabs et tiers-lieux pour
            partager leurs savoir-faire. Vous formez, vous vous formez — en équilibre. Et surtout, vous restez autonomes dans ce que vous pouvez proposer à vos bénévoles.
          </p>
          <div class="hero__cta">
            ${user
              ? `<a href="/catalogue" class="btn btn--primary btn--lg">Voir le catalogue</a>
                 <a href="/tableau-de-bord" class="btn btn--secondary btn--lg" style="border-color:rgba(255,255,255,0.5);color:white">Mon espace</a>`
              : `<a href="/inscription" class="btn btn--primary btn--lg">Rejoindre gratuitement</a>
                 <a href="/catalogue" class="btn btn--secondary btn--lg" style="border-color:rgba(255,255,255,0.5);color:white">Voir les formations</a>`
            }
          </div>
          <div class="hero__stats" id="hero-stats">
            <div><div class="stat__value">…</div><div class="stat__label">Structures membres</div></div>
            <div><div class="stat__value">…</div><div class="stat__label">Formations proposées</div></div>
            <div><div class="stat__value">…</div><div class="stat__label">Échanges réalisés</div></div>
          </div>
        </div>
      </div>
    </section>

    <!-- COMMENT ÇA MARCHE -->
    <section class="section">
      <div class="container">
        <div class="section__header">
          <div class="section__eyebrow">Fonctionnement</div>
          <h2>Simple, équitable, transparent</h2>
        </div>
        <div class="how-it-works">
          <div class="step">
            <div class="step__icon">📝</div>
            <h4>Créez votre profil</h4>
            <p>Décrivez votre structure, les formations que vous proposez et celles que vous cherchez.</p>
          </div>
          <div class="step">
            <div class="step__icon">🔍</div>
            <h4>Explorez le catalogue</h4>
            <p>Parcourez les formations disponibles près de chez vous ou à distance.</p>
          </div>
          <div class="step">
            <div class="step__icon">🤝</div>
            <h4>Proposez un échange</h4>
            <p>Contactez une structure, organisez l'échange via la messagerie intégrée.</p>
          </div>
          <div class="step">
            <div class="step__icon">⚖️</div>
            <h4>Restez en équilibre</h4>
            <p>La plateforme veille à ce que chacun donne autant qu'il reçoit (±5 formations).</p>
          </div>
        </div>
      </div>
    </section>

    <!-- SYSTÈME D'ÉQUILIBRE -->
    <section class="section section--alt">
      <div class="container">
        <div class="balance-explainer">
          <div>
            <div class="section__eyebrow" style="color:var(--color-moss)">Le cœur du système</div>
            <h2 style="color:white">L'équilibre participant / formateur</h2>
            <p style="color:rgba(245,240,232,0.8);margin-top:var(--space-md);line-height:1.7">
              Chaque membre peut être <strong>participant</strong> (se faire former) et <strong>formateur</strong>
              (former des bénévoles d'autres structures). La différence entre les deux ne peut pas dépasser
              <strong>5 formations</strong>, pour garantir la réciprocité.
            </p>
            <p style="color:rgba(245,240,232,0.6);margin-top:var(--space-md);font-size:0.9rem;font-family:var(--font-ui)">
              Ce n'est pas une transaction : c'est une logique du don et du contre-don, adaptée aux réalités associatives.
            </p>
          </div>
          <div class="balance-visual">
            <div class="balance-row">
              <span class="balance-pill pill--green">Participant ×3</span>
              <span style="color:rgba(245,240,232,0.6)">formations reçues</span>
            </div>
            <div class="balance-row">
              <span class="balance-pill pill--green">Formateur ×2</span>
              <span style="color:rgba(245,240,232,0.6)">formations données</span>
            </div>
            <div style="color:var(--color-moss);font-family:var(--font-ui);font-size:0.9rem;padding:8px 0">
              ✓ Différence = 1 — Équilibré
            </div>
            <div class="balance-row" style="margin-top:var(--space-md);padding-top:var(--space-md);border-top:1px solid rgba(255,255,255,0.15)">
              <span class="balance-pill pill--orange">Participant ×8</span>
              <span style="color:rgba(245,240,232,0.6)">formations reçues</span>
            </div>
            <div class="balance-row">
              <span class="balance-pill pill--green">Formateur ×2</span>
              <span style="color:rgba(245,240,232,0.6)">formations données</span>
            </div>
            <div style="color:var(--color-terracotta);font-family:var(--font-ui);font-size:0.9rem;padding:8px 0">
              ✕ Différence = 6 — Blocage temporaire
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FORMATIONS EN VEDETTE -->
    <section class="featured-section">
      <div class="container">
        <div class="section__header flex justify-between items-center">
          <div>
            <div class="section__eyebrow">Catalogue</div>
            <h2>Formations récentes</h2>
          </div>
          <a href="/catalogue" class="btn btn--secondary">Voir tout →</a>
        </div>
        <div class="grid grid--2" id="featured-formations">
          ${[1,2,3].map(() => `<div class="card" style="height:180px;background:var(--color-sand);animation:none"></div>`).join('')}
        </div>
      </div>
    </section>

    <!-- CTA FINAL -->
    ${!user ? `
    <section class="section" style="background:var(--color-forest);color:white;text-align:center">
      <div class="container--narrow">
        <h2 style="color:white">Prêt à rejoindre la communauté ?</h2>
        <p style="color:rgba(245,240,232,0.8);margin:var(--space-lg) 0;font-size:1.05rem">
          Inscription gratuite. 2 formations sans abonnement pour tester la plateforme.
        </p>
        <a href="/inscription" class="btn btn--primary btn--lg" style="background:white;color:var(--color-forest);border-color:white">
          Créer mon compte gratuitement
        </a>
      </div>
    </section>
    <section style="padding:var(--space-xl) 0;background:var(--color-background-primary)">
      <div class="container">
        <div style="background:#e8f5e9;border:1.5px solid #81c784;border-radius:16px;padding:var(--space-xl) var(--space-xl);max-width:860px;margin:0 auto">
          <h2 style="margin-bottom:var(--space-md);font-size:1.2rem;color:#2d6d39">Transparence &amp; IA</h2>
          <p style="color:#2d4a2f;line-height:1.9;font-size:1rem">Nous tenons à être transparents : ce projet, développé par une étudiante en Master, a été conçu avec l'aide d'outils d'IA. Le maintien et la sécurité de la plateforme reposent également sur ces outils. Une fois le projet stabilisé et doté des ressources nécessaires, ces outils seront remplacés par une équipe humaine salariée. En attendant, l'IA nous permet de faire avancer ce projet tout en restant fidèles à nos idéaux éthiques et de transparence.</p>
          <p style="margin-top:var(--space-md);font-weight:600;color:#2d6d39">Objectif pour humaniser le projet : <span style="font-family:var(--font-display);font-size:1.3rem">100 structures adhérentes</span></p>
        </div>
      </div>
    </section>
    ` : ''}
  `;

  // Charger stats et formations en arrière-plan
  loadHomeData();
}

async function loadHomeData() {
  try {
    const [users, formations] = await Promise.all([Users.list(), Formations.list()]);

    // Stats
    const stats = document.getElementById('hero-stats');
    if (stats) {
      const offered = formations.filter(f => f.type === 'offered').length;
      stats.innerHTML = `
        <div><div class="stat__value">${users.length}</div><div class="stat__label">Structures membres</div></div>
        <div><div class="stat__value">${offered}</div><div class="stat__label">Formations proposées</div></div>
        <div><div class="stat__value">${formations.length}</div><div class="stat__label">Formations référencées</div></div>
      `;
    }

    // Formations en vedette
    const featured = document.getElementById('featured-formations');
    if (featured) {
      const sample = formations.filter(f => f.type === 'offered').slice(0, 3);
      const user = Session.getUser();
      featured.innerHTML = sample.length
        ? sample.map(f => formationCardHTML(f, false, user?.id)).join('')
        : `<div class="empty-state"><div class="empty-state__icon">🌱</div><p>Aucune formation pour l'instant</p></div>`;
    }
  } catch {}
}

// =============================================
// PAGE : CATALOGUE
// =============================================
async function renderCatalogue(app) {
  app.innerHTML = `
    <div class="section">
      <div class="container">
        <div class="section__header">
          <div class="section__eyebrow">Toutes les formations</div>
          <h2>Catalogue</h2>
          <p class="text-muted font-ui" style="margin-top:var(--space-sm);max-width:600px"><strong>Trouvez la formation qu'il vous faut.</strong> Utilisez les filtres par type, catégorie ou mot-clé pour affiner votre recherche. Une fois la formation repérée, contactez directement la structure via la messagerie intégrée".<br> 
          Parce que former a un coût, certaines structures proposent aussi des ateliers et formations marchandes — retrouvez-les juste en-dessous.</p>
          <p style="margin-top:var(--space-sm);font-size:0.85rem"><a href="/diffusion" style="color:var(--color-text-muted);text-decoration:underline">Diffusion des ateliers et formations marchandes &rarr;</a></p>
        </div>

        <!-- Barre de filtres -->
        <div style="display:flex;gap:var(--space-md);flex-wrap:wrap;align-items:center;margin-bottom:var(--space-lg)">
          <input type="text" class="form-input" id="search-input" placeholder="Rechercher une formation…" style="flex:1;min-width:200px;max-width:360px">
          <div class="filters-bar" id="type-filters">
          <button class="filter-chip" data-type="my-alerts">🔔 Mes alertes</button>
            <button class="filter-chip active" data-type="">Toutes</button>
            <button class="filter-chip" data-type="offered">🌱 Proposées</button>
            <button class="filter-chip" data-type="wanted">🔍 Recherchées</button>
          </div>
        </div>

        <!-- Chips catégories -->
        <div class="filters-bar" id="category-filters" style="margin-bottom:var(--space-xl)">
          <button class="filter-chip active" data-cat="">Toutes catégories</button>
        </div>

        <div class="grid grid--2" id="formations-grid">
          <div class="empty-state" style="grid-column:1/-1"><div class="spinner"></div></div>
        </div>
      </div>
    </div>
  `;

  const user = Session.getUser();
  let allFormations = [];
  let activeType = '';
  let activeCategory = '';
  let searchValue = '';

  try { allFormations = await Formations.list(); } catch {}

  // Remplir catégories
  const cats = [...new Set(allFormations.map(f => f.category))];
  const catFilters = document.getElementById('category-filters');
  cats.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'filter-chip';
    btn.dataset.cat = c;
    btn.textContent = c;
    catFilters.appendChild(btn);
  });

async function filterAndRender() {
    let list = allFormations;

    if (activeType === 'my-alerts') {
      if (!Session.isLoggedIn()) {
        document.getElementById('formations-grid').innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">🔔</div><h3>Connectez-vous pour voir vos alertes</h3><a href="/connexion" class="btn btn--primary mt-md">Se connecter</a></div>`;
        return;
      }
      try {
        const res = await fetch('/api/alerts/matches', { headers: { Authorization: `Bearer ${localStorage.getItem('troclab_token')}` } });
        list = await res.json();
      } catch { list = []; }
    } else {
      if (activeType) list = list.filter(f => f.type === activeType);
    }

    if (activeCategory) list = list.filter(f => f.category === activeCategory);
    if (searchValue) {
      const q = searchValue.toLowerCase();
      list = list.filter(f =>
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    }
    const grid = document.getElementById('formations-grid');
    grid.innerHTML = list.length
      ? list.map(f => formationCardHTML(f, false, user?.id)).join('')
      : `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">🔍</div><h3>Aucune formation trouvée</h3><p>Modifiez les filtres ou <a href="/inscription" style="color:var(--color-forest)">proposez la vôtre</a>.</p></div>`;
  }

  filterAndRender();

  // Filtres type
  document.getElementById('type-filters').addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    document.querySelectorAll('#type-filters .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeType = chip.dataset.type;
    filterAndRender();
  });

  // Filtres catégorie
  catFilters.addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    document.querySelectorAll('#category-filters .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeCategory = chip.dataset.cat;
    filterAndRender();
  });

  // Recherche
  document.getElementById('search-input').addEventListener('input', e => {
    searchValue = e.target.value;
    filterAndRender();
  });
}

// =============================================
// PAGE : CARTE
// =============================================
async function renderCarte(app) {
  app.innerHTML = `
    <div class="section">
      <div class="container">
        <div class="section__header">
          <div class="section__eyebrow">Géographie du réseau</div>
          <h2>Carte des structures</h2>
          <p class="text-muted font-ui" style="margin-top:8px">Survolez un point pour voir les formations disponibles.</p>
        </div>
        <div id="map"></div>
      </div>
    </div>
  `;

  let users = [];
  try { users = await Users.list(); } catch {}

  const map = L.map('map').setView([46.5, 2.5], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>'
  }).addTo(map);

  const orgColors = { fablab: '#2D6A4F', association: '#457B9D', coop: '#E76F51', 'tiers-lieu': '#9B2335', ess: '#6B705C', autre: '#4A4E69' };

  let formations = [];
  try { formations = await Formations.list(); } catch {}

  users.forEach(u => {
    const color = u.avatar_color || orgColors[u.organisation_type] || '#2D6A4F';
    const icon = L.divIcon({
      html: `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
      className: '', iconSize: [20, 20], iconAnchor: [10, 10]
    });

    const anciennete = Math.floor((Date.now() - new Date(u.created_at)) / (1000 * 60 * 60 * 24 * 30));
    const moisLabel = anciennete < 1 ? 'Nouveau membre' : `Membre depuis ${anciennete} mois`;

    const userFormations = formations.filter(f => f.user_id === u.id);
    const offered = userFormations.filter(f => f.type === 'offered');
    const wanted = userFormations.filter(f => f.type === 'wanted');

    const popup = `
      <div class="map-popup" style="min-width:220px;padding:4px">
        <h4>${escapeHtml(u.organisation)}</h4>
        <span class="org-type">${orgTypeLabel(u.organisation_type)}</span>
        <p>📍 ${escapeHtml(u.city)}</p>
        <p>🕐 ${moisLabel}</p>
        ${offered.length > 0 ? `<p style="margin-top:8px"><strong>🌱 Propose :</strong><br>${offered.map(f => `• ${escapeHtml(f.title)}`).join('<br>')}</p>` : ''}
        ${wanted.length > 0 ? `<p style="margin-top:8px"><strong>🔍 Recherche :</strong><br>${wanted.map(f => `• ${escapeHtml(f.title)}`).join('<br>')}</p>` : ''}
        <a href="/profil/${u.id}" onclick="navigate('/profil/${u.id}');return false" style="color:var(--color-forest);font-family:var(--font-ui);font-size:0.82rem;font-weight:600;margin-top:8px;display:inline-block">Voir le profil →</a>
      </div>
    `;

    L.marker([u.latitude, u.longitude], { icon }).addTo(map).bindPopup(popup);
  });
}

// =============================================
// PAGE : À PROPOS
// =============================================
function renderAbout(app) {
  app.innerHTML = `
    <section class="hero" style="padding:var(--space-xl) 0">
      <div class="container">
        <div class="hero__content">
          <div class="hero__eyebrow">Transparence totale</div>
          <h1>À propos de TrocLab</h1>
          <p class="hero__sub">Comment fonctionne la plateforme, d'où vient l'argent, et pourquoi on l'a construite.</p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container--narrow">

        <h2 style="margin-bottom:var(--space-md)">Notre raison d'être</h2>
        <p>TrocLab est née d'un constat simple : les structures de l'ESS, les fablabs et les associations ont
        énormément à s'apprendre mutuellement. Mais les formations coûtent cher, et les budgets formation
        des associations sont souvent quasi-inexistants.</p>
        <p style="margin-top:var(--space-md)">L'idée est ancienne comme le monde : l'échange de services,
        sans argent, fondé sur la réciprocité. TrocLab apporte simplement un cadre numérique pour
        organiser ces échanges à plus grande échelle.</p>

        <div class="divider"></div>

        <h2 id="fonctionnement" style="margin-bottom:var(--space-md)">Comment ça marche en détail</h2>

        <h4 style="margin-bottom:var(--space-sm)">Le rôle de participant</h4>
        <p>En tant que <em>participant</em>, vous allez vous faire former grâce à une autre structure.
        Vous profitez de leur expertise, possiblement de leur lieu, de leurs outils.</p>

        <h4 style="margin-top:var(--space-lg);margin-bottom:var(--space-sm)">Le rôle de formateur</h4>
        <p>En tant qu'<em>formateur</em>, vous accueillez ou allez vers des bénévoles d'autres structures et vous leur
        transmettez un savoir-faire. C'est vous qui préparez et animez la formation.</p>

        <h4 style="margin-top:var(--space-lg);margin-bottom:var(--space-sm)">La règle d'équilibre</h4>
        <p>Le nombre de fois où vous avez été participant moins le nombre de fois où vous avez été formateur
        ne peut pas dépasser <strong>5</strong>. Ce mécanisme garantit que personne ne "consomme"
        la plateforme sans contribuer. Si vous atteignez la limite, la plateforme vous invite à
        proposer des formations avant de pouvoir en demander de nouvelles.</p>

        <div class="divider"></div>

        <h2 id="financement" style="margin-bottom:var(--space-md)">Le modèle économique</h2>

        <div class="grid grid--2" style="margin-bottom:var(--space-xl)">
          <div class="card">
            <h4>Accès gratuit</h4>
            <p class="text-small text-muted" style="margin-top:8px">Jusqu'à 2 formations publiées.
            Pour tester la plateforme sans engagement.</p>
          </div>
          <div class="card" style="border-color:var(--color-forest)">
            <h4>Abonnement annuel</h4>
            <p style="font-family:var(--font-display);font-size:1.8rem;color:var(--color-forest);margin:8px 0">50 €<span style="font-size:1rem;color:var(--color-text-muted);font-family:var(--font-ui)">/an — soit 4,17€/mois</span></p>
            <p class="text-small text-muted">Formations illimitées, accès à tous les outils, soutien au projet.</p>
          </div>
        </div>

        <h4 style="margin-bottom:var(--space-sm)">Où va l'argent ?</h4>
        <p>TrocLab est un projet à but non lucratif. Les recettes d'abonnement couvrent :</p>
        <ul style="margin-top:var(--space-md);padding-left:var(--space-lg);font-family:var(--font-ui);line-height:2">
          <li>L'hébergement et la maintenance technique (≈40%)</li>
          <li>La coordination et animation de la communauté (≈35%)</li>
          <li>Le développement de nouvelles fonctionnalités (≈25%)</li>
        </ul>
        <p style="margin-top:var(--space-md)">Nous sollicitons également des subventions auprès de fondations et
        collectivités soutenant l'ESS et l'éducation populaire. Chaque année, un bilan financier transparent
        est publié sur cette page.</p>

    <section style="padding:var(--space-xl) 0;background:var(--color-background-primary)">
      <div class="container">
        <div style="background:#e8f5e9;border:1.5px solid #81c784;border-radius:16px;padding:var(--space-xl) var(--space-xl);max-width:860px;margin:0 auto">
          <h2 style="margin-bottom:var(--space-md);font-size:1.2rem;color:#2d6d39">Transparence &amp; IA</h2>
          <p style="color:#2d4a2f;line-height:1.9;font-size:1rem">Nous tenons à être transparents : ce projet, développé par une étudiante en Master, a été conçu avec l'aide d'outils d'IA. Le maintien et la sécurité de la plateforme reposent également sur ces outils. Une fois le projet stabilisé et doté des ressources nécessaires, ces outils seront remplacés par une équipe humaine salariée. En attendant, l'IA nous permet de faire avancer ce projet tout en restant fidèles à nos idéaux éthiques et de transparence.</p>
          <p style="margin-top:var(--space-md);font-weight:600;color:#2d6d39">Objectif pour humaniser le projet : <span style="font-family:var(--font-display);font-size:1.3rem">100 structures adhérentes</span></p>
        </div>
      </div>
    </section>
        <div class="divider"></div>

        <h2 id="mentions" style="margin-bottom:var(--space-md)">Mentions légales</h2>
        <p class="text-muted font-ui text-small">
          TrocLab est une association loi 1901. Siège social : [Adresse à compléter]. SIRET : [à compléter].
          Hébergement : [à compléter]. Directeur de publication : [à compléter].
          Contact : <a href="mailto:alexane.groussard@gmail.com" style="color:var(--color-forest)">alexane.groussard@gmail.com</a>
        </p>

        <div class="divider"></div>

        <div class="alert alert--info">
          <strong>Une question, une idée ?</strong> TrocLab est une plateforme communautaire.
          Vos retours comptent vraiment. Écrivez-nous à
          <a href="mailto:alexane.groussard@gmail.com" style="color:var(--color-sky)">alexane.groussard@gmail.com</a>
        </div>

      </div>
    </section>
  `;
}

// =============================================
// PAGE : CONNEXION
// =============================================
function renderLogin(app) {
  if (Session.isLoggedIn()) { navigate('/tableau-de-bord'); return; }

  app.innerHTML = `
    <div class="section">
      <div class="container--narrow" style="max-width:420px">
        <div style="text-align:center;margin-bottom:var(--space-xl)">
          <div style="font-size:2.5rem;margin-bottom:var(--space-md)">⟳</div>
          <h2>Connexion</h2>
          <p class="text-muted font-ui text-small">Pas encore de compte ? <a href="/inscription" style="color:var(--color-forest)">Inscrivez-vous</a></p>
        </div>
        <div class="card" style="padding:var(--space-xl)">
          <div id="login-error"></div>
          <div class="form-group mb-md">
            <label class="form-label" for="login-email">Email</label>
            <input class="form-input w-full" type="email" id="login-email" placeholder="vous@structure.org" autocomplete="email">
          </div>
          <div class="form-group mb-lg">
            <label class="form-label" for="login-pass">Mot de passe</label>
            <input class="form-input w-full" type="password" id="login-pass" placeholder="••••••••" autocomplete="current-password">
          </div>
          <button class="btn btn--primary w-full" id="login-btn" onclick="submitLogin()">Se connecter</button>
          <p class="text-muted font-ui" style="font-size:0.78rem;text-align:center;margin-top:var(--space-md)">
            Comptes démo : alice@fablab-paris.org / password
          </p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') submitLogin(); });
}

async function submitLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  errEl.innerHTML = '';

  if (!email || !pass) {
    errEl.innerHTML = `<div class="alert alert--error mb-md">Veuillez remplir tous les champs.</div>`;
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:16px;height:16px"></span> Connexion…';
  try {
    const { token, user } = await Auth.login(email, pass);
    Session.save(token, user);
    renderNav();
    Toast.success(`Bienvenue, ${user.name} !`);
    navigate('/tableau-de-bord');
  } catch (err) {
    errEl.innerHTML = `<div class="alert alert--error mb-md">${err.message || 'Identifiants incorrects'}</div>`;
    btn.disabled = false;
    btn.textContent = 'Se connecter';
  }
}

// =============================================
// PAGE : INSCRIPTION
// =============================================
function renderRegister(app) {
  if (Session.isLoggedIn()) { navigate('/tableau-de-bord'); return; }

  app.innerHTML = `
    <div class="section">
      <div class="container--narrow" style="max-width:500px">
        <div style="text-align:center;margin-bottom:var(--space-xl)">
          <div style="font-size:2.5rem;margin-bottom:var(--space-md)">🌱</div>
          <h2>Rejoindre TrocLab</h2>
          <p class="text-muted font-ui text-small">Déjà membre ? <a href="/connexion" style="color:var(--color-forest)">Connectez-vous</a></p>
        </div>
        <div class="card" style="padding:var(--space-xl)">
          <div id="reg-error"></div>
          <div class="form-group mb-md">
            <label class="form-label">Nom complet *</label>
            <input class="form-input w-full" type="text" id="reg-name" placeholder="Alice Martin">
          </div>
          <div class="form-group mb-md">
            <label class="form-label">Email *</label>
            <input class="form-input w-full" type="email" id="reg-email" placeholder="alice@mastructure.org">
          </div>
          <div class="form-group mb-md">
            <label class="form-label">Mot de passe * <span class="form-hint">(6 car. minimum)</span></label>
            <input class="form-input w-full" type="password" id="reg-pass" placeholder="••••••••">
          </div>
          <div class="form-group mb-md">
            <label class="form-label">Nom de votre structure *</label>
            <input class="form-input w-full" type="text" id="reg-org" placeholder="FabLab de Montreuil">
          </div>
          <div class="form-group mb-md">
            <label class="form-label">Type de structure</label>
            <select class="form-select w-full" id="reg-orgtype">
              <option value="association">Association</option>
              <option value="fablab">FabLab</option>
              <option value="tiers-lieu">Tiers-lieu</option>
              <option value="coop">Coopérative / SCOP</option>
              <option value="ess">Structure ESS</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div class="form-group mb-lg">
            <label class="form-label">Ville</label>
            <input class="form-input w-full" type="text" id="reg-city" placeholder="Paris">
          </div>
          <button class="btn btn--primary w-full" id="reg-btn" onclick="submitRegister()">Créer mon compte</button>
          <div class="alert alert--info mt-md">
            <span>ℹ️</span>
            <span><strong>Accès gratuit :</strong> jusqu'à 2 formations sans abonnement pour découvrir la plateforme.</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function submitRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-pass').value;
  const organisation = document.getElementById('reg-org').value.trim();
  const organisation_type = document.getElementById('reg-orgtype').value;
  const city = document.getElementById('reg-city').value.trim();
  const btn = document.getElementById('reg-btn');
  const errEl = document.getElementById('reg-error');
  errEl.innerHTML = '';

  if (!name || !email || !password || !organisation) {
    errEl.innerHTML = `<div class="alert alert--error mb-md">Veuillez remplir les champs obligatoires (*).</div>`;
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:16px;height:16px"></span> Création…';
  try {
    const { token, user } = await Auth.register({ name, email, password, organisation, organisation_type, city });
    Session.save(token, user);
    renderNav();
    Toast.success('Bienvenue sur TrocLab !');
    navigate('/tableau-de-bord');
  } catch (err) {
    errEl.innerHTML = `<div class="alert alert--error mb-md">${err.message}</div>`;
    btn.disabled = false;
    btn.textContent = 'Créer mon compte';
  }
}

// =============================================
// PAGE : TABLEAU DE BORD
// =============================================
async function renderDashboard(app) {
  const user = Session.getUser();
  app.innerHTML = `
    <div class="section">
      <div class="container">
        <div class="section__header flex justify-between items-center" style="flex-wrap:wrap;gap:var(--space-md)">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;width:100%">
            <div>
              <div style="display:flex;align-items:center;gap:var(--space-md)">
                <div class="section__eyebrow">Mon espace</div>
                <button onclick="Auth.logout()" class="btn btn--ghost btn--sm" style="font-size:0.8rem;padding:2px 10px">Se déconnecter</button>
              </div>
              <h2>Bonjour, ${escapeHtml(user.name)} 👋</h2>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="filters-bar" id="dash-tabs" style="margin-bottom:var(--space-xl)">
          <button class="filter-chip active" data-tab="overview">Vue d'ensemble</button>
          <button class="filter-chip" data-tab="formations">Mes formations</button>
          <button class="filter-chip" data-tab="exchanges">Mes échanges</button>
          <button class="filter-chip" data-tab="alerts">Mes alertes</button>
          ${Session.getUser()?.is_admin ? '<button class="filter-chip" data-tab="admin">Modération</button>' : ''}
          <button class="filter-chip" data-tab="profile">Mon profil</button>
        </div>

        <div id="dash-content">
          <div class="empty-state"><div class="spinner"></div></div>
        </div>
      </div>
    </div>
  `;

  // Charger les données
  let freshUser, formations, exchanges;
  try {
    [freshUser, formations, exchanges] = await Promise.all([
      Auth.me(), Formations.mine(), Exchanges.list()
    ]);
    localStorage.setItem('troclab_user', JSON.stringify(freshUser)); // Mettre à jour le cache (on garde le token)
    localStorage.setItem('troclab_user', JSON.stringify(freshUser));
  } catch {
    freshUser = user;
    formations = [];
    exchanges = [];
  }

  function renderTab(tab) {
    const content = document.getElementById('dash-content');
    if (tab === 'overview') renderDashOverview(content, freshUser, formations, exchanges);
    else if (tab === 'formations') renderDashFormations(content, formations, freshUser);
    else if (tab === 'exchanges') renderDashExchanges(content, exchanges, freshUser);
    else if (tab === 'alerts') renderDashAlerts(content);
    else if (tab === 'admin') renderDashAdmin(content);
    else if (tab === 'profile') renderDashProfile(content, freshUser);
  }

  renderTab('overview');

  document.getElementById('dash-tabs').addEventListener('click', e => {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    document.querySelectorAll('#dash-tabs .filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    renderTab(chip.dataset.tab);
  });
}

function renderDashOverview(el, user, formations, exchanges) {
  const offered = formations.filter(f => f.type === 'offered' && f.status === 'active').length;
  const wanted = formations.filter(f => f.type === 'wanted' && f.status === 'active').length;
  const traveler = user.formations_as_traveler || 0;
  const host = user.formations_as_host || 0;
  const imbalance = traveler - host;
  const balancePct = Math.max(0, Math.min(100, host > 0 ? (host / Math.max(traveler, 1)) * 100 : 0));
  const isSubscribed = user.subscription === 'premium';

  el.innerHTML = `
    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-card__value">${offered}</div>
        <div class="stat-card__label">Formations proposées</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__value">${wanted}</div>
        <div class="stat-card__label">Formations recherchées</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__value">${traveler}</div>
        <div class="stat-card__label">Fois participant</div>
      </div>
      <div class="stat-card">
        <div class="stat-card__value">${host}</div>
        <div class="stat-card__label">Fois formateur</div>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- Sidebar -->
      <div>
        <!-- Équilibre -->
        <div class="sidebar-card" style="margin-bottom:var(--space-lg)">
          <h4 style="margin-bottom:var(--space-md)">⚖️ Équilibre</h4>
          <div class="flex justify-between font-ui text-small mb-sm">
            <span>Formateur (${host})</span>
            <span>Participant (${traveler})</span>
          </div>
          <div class="balance-bar"><div class="balance-bar__fill" style="width:${balancePct}%"></div></div>
          ${imbalance > 4
            ? `<div class="alert alert--warning mt-sm">Vous avez reçu ${imbalance} formations de plus que vous n'en avez donné. Proposez des formations pour rééquilibrer.</div>`
            : `<p class="text-small text-muted font-ui mt-sm">Différence : ${imbalance} — ${imbalance <= 2 ? '✓ Bien équilibré' : '⚠ À surveiller'}</p>`
          }
        </div>

        <!-- Abonnement -->
        <div class="sidebar-card">
          <h4 style="margin-bottom:var(--space-sm)">💳 Abonnement</h4>
          ${isSubscribed
            ? `<span class="formation-badge badge--offered">Premium actif</span>
               <p class="text-small text-muted font-ui mt-sm">Accès illimité à toutes les fonctionnalités.</p>`
            : `<p class="text-small text-muted font-ui mb-md">Plan gratuit — ${formations.length}/2 formations utilisées</p>
               <div style="background:var(--color-sand);border-radius:8px;height:8px;margin-bottom:var(--space-md)">
                 <div style="background:var(--color-forest);border-radius:8px;height:8px;width:${(formations.length/2)*100}%"></div>
               </div>
               <button onclick="openUpgradeModal()" class="btn btn--primary w-full btn--sm">Passer à Premium — 50€/an</button>`
          }
        </div>
      </div>

      <!-- Contenu principal -->
      <div>
        <!-- Échanges récents -->
        <h3 style="margin-bottom:var(--space-md)">Échanges récents</h3>
        ${exchanges.length === 0
          ? `<div class="empty-state card"><div class="empty-state__icon">🤝</div><h3>Pas encore d'échange</h3><p>Parcourez le <a href="/catalogue" style="color:var(--color-forest)">catalogue</a> pour demander votre première formation.<br>ou <a onclick="openNewFormationModal()" style="color:var(--color-terracotta);cursor:pointer;font-weight:500">ajouter</a> votre propre formation dès maintenant.</p></div>`
          : exchanges.slice(0, 5).map(ex => `
              <div class="card mb-md" style="display:flex;align-items:center;gap:var(--space-md);flex-wrap:wrap">
                <div style="flex:1;min-width:200px">
                  <div class="font-ui" style="font-weight:600;font-size:0.9rem">${escapeHtml(ex.formation_title)}</div>
                  <div class="text-muted text-small font-ui">
                    ${ex.traveler_id === user.id ? `Vous → ${escapeHtml(ex.host_name)}` : `${escapeHtml(ex.traveler_name)} → Vous`}
                    · ${formatDate(ex.created_at)}
                  </div>
                </div>
                ${exchangeStatusLabel(ex.status)}
                ${ex.status === 'pending' && ex.host_id === user.id ? `
                  <div class="flex gap-sm">
                    <button onclick="updateExchangeStatus('${ex.id}','accepted')" class="btn btn--primary btn--sm">Accepter</button>
                    <button onclick="updateExchangeStatus('${ex.id}','refused')" class="btn btn--ghost btn--sm">Refuser</button>
                  </div>` : ''}
                ${ex.status === 'accepted' ? `
                  <button onclick="updateExchangeStatus('${ex.id}','completed')" class="btn btn--secondary btn--sm">Marquer terminé</button>` : ''}
              </div>
            `).join('')
        }
      </div>
    </div>
  `;
}

function renderDashFormations(el, formations, user) {
  el.innerHTML = `
    <div class="flex justify-between items-center mb-lg" style="flex-wrap:wrap;gap:var(--space-md)">
      <h3>Mes formations (${formations.filter(f=>f.status!=='archived').length})</h3>
      <a onclick="openNewFormationModal()" style="color:var(--color-terracotta);cursor:pointer;font-weight:500;font-size:0.9rem">+ Ajouter une formation</a>
    </div>
    ${formations.filter(f => f.status !== 'archived').length === 0
      ? `<div class="empty-state card"><div class="empty-state__icon">📚</div><h3>Aucune formation</h3><p>Ajoutez vos premières formations pour rejoindre le réseau.</p></div>`
      : `<div class="grid grid--2">${formations.filter(f=>f.status!=='archived').map(f => formationCardHTML(f, true, user.id)).join('')}</div>`
    }
  `;
}

function renderDashExchanges(el, exchanges, user) {
  el.innerHTML = `
    <h3 style="margin-bottom:var(--space-lg)">Mes échanges (${exchanges.length})</h3>
    ${exchanges.length === 0
      ? `<div class="empty-state card"><div class="empty-state__icon">🤝</div><h3>Pas encore d'échange</h3><p>Parcourez le catalogue pour demander une formation.</p></div>`
      : exchanges.map(ex => `
          <div class="card mb-md">
            <div class="flex items-center justify-between" style="flex-wrap:wrap;gap:var(--space-md)">
              <div>
                <div style="font-weight:600;margin-bottom:4px">${escapeHtml(ex.formation_title)}</div>
                <div class="text-muted text-small font-ui">
                  ${ex.traveler_id === user.id
                    ? `🧳 Vous voyagez chez <strong>${escapeHtml(ex.host_name)}</strong>`
                    : `🏠 Vous accueillez <strong>${escapeHtml(ex.traveler_name)}</strong>`
                  }
                  · ${formatDate(ex.created_at)}
                </div>
              </div>
              <div class="flex gap-sm items-center">
                ${exchangeStatusLabel(ex.status)}
                ${ex.status === 'pending' && ex.host_id === user.id ? `
                  <button onclick="updateExchangeStatus('${ex.id}','accepted')" class="btn btn--primary btn--sm">Accepter</button>
                  <button onclick="updateExchangeStatus('${ex.id}','refused')" class="btn btn--ghost btn--sm">Refuser</button>` : ''}
                ${ex.status === 'accepted' ? `<button onclick="updateExchangeStatus('${ex.id}','completed')" class="btn btn--secondary btn--sm">Terminer</button>` : ''}
              </div>
            </div>
          </div>
        `).join('')
    }
  `;
}

function renderDashProfile(el, user) {
  el.innerHTML = `
    <div class="container--narrow" style="max-width:560px;margin:0">
      <h3 style="margin-bottom:var(--space-xl)">Mon profil</h3>
      <div class="flex items-center gap-lg mb-lg">
        <div class="avatar avatar--xl" style="background:${user.avatar_color}">${avatarInitials(user.name)}</div>
        <div>
          <h3>${escapeHtml(user.name)}</h3>
          <div class="font-ui text-small text-muted">${orgTypeLabel(user.organisation_type)} · ${escapeHtml(user.city || '')}</div>
          <div class="font-ui text-small" style="color:var(--color-forest);margin-top:4px">Membre depuis ${formatDate(user.created_at)}</div>
        </div>
      </div>
      <div id="profile-error"></div>
      <div class="form-group mb-md">
        <label class="form-label">Nom complet</label>
        <input class="form-input w-full" id="p-name" value="${escapeHtml(user.name)}">
      </div>
     <div class="form-group mb-md">
        <label class="form-label">Structure</label>
        <input class="form-input w-full" id="p-org" value="${escapeHtml(user.organisation)}">
      </div>
      <div class="form-group mb-md">
        <label class="form-label">Site web</label>
        <input class="form-input w-full" id="p-website" placeholder="https://monfablab.org" value="${escapeHtml(user.website||'')}">
      </div>
      <div class="form-group mb-md">
  <label class="form-label" style="display:flex;align-items:center;justify-content:space-between">
    <span>Notifications email</span>
    <input type="checkbox" id="p-email-notif" ${user.email_notifications !== false ? 'checked' : ''} style="width:20px;height:20px;cursor:pointer">
  </label>
  <p class="form-hint">Recevoir un email quand vous recevez un message sur TrocLab</p>
</div>
      <div class="form-group mb-md">
        <label class="form-label">Type de structure</label>
        <select class="form-select w-full" id="p-orgtype">
          ${['association','fablab','tiers-lieu','coop','ess','autre'].map(t =>
            `<option value="${t}" ${user.organisation_type===t?'selected':''}>${orgTypeLabel(t)}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group mb-md">
        <label class="form-label">Ville</label>
        <input class="form-input w-full" id="p-city" value="${escapeHtml(user.city||'')}">
      </div>
      <div class="form-group mb-lg">
        <label class="form-label">Présentation</label>
        <textarea class="form-textarea w-full" id="p-bio" rows="4" placeholder="Décrivez votre structure, vos savoir-faire…">${escapeHtml(user.bio||'')}</textarea>
      </div>
      <button class="btn btn--primary" onclick="saveProfile()">Enregistrer</button>
    </div>
  `;
}

async function saveProfile() {
  const payload = {
    name: document.getElementById('p-name')?.value.trim(),
    organisation: document.getElementById('p-org')?.value.trim(),
    organisation_type: document.getElementById('p-orgtype')?.value,
    city: document.getElementById('p-city')?.value.trim(),
    bio: document.getElementById('p-bio')?.value.trim(),
    website: document.getElementById('p-website')?.value.trim(),
    email_notifications: document.getElementById('p-email-notif')?.checked,
  };
  try {
    const updated = await Users.updateMe(payload);
    localStorage.setItem('troclab_user', JSON.stringify(updated));
    Toast.success('Profil mis à jour');
  } catch (err) {
    Toast.error(err.message);
  }
}

// =============================================
// PAGE : PROFIL PUBLIC
// =============================================
async function renderProfil(app, params) {
  app.innerHTML = `<div class="section"><div class="container"><div class="empty-state"><div class="spinner"></div></div></div></div>`;
  let data;
  try { data = await Users.get(params.id); } catch {
    app.innerHTML = `<div class="section"><div class="container"><div class="alert alert--error">Profil introuvable.</div></div></div>`;
    return;
  }

  const currentUser = Session.getUser();
  const formations_offered = data.formations.filter(f => f.type === 'offered');
  const formations_wanted = data.formations.filter(f => f.type === 'wanted');

  app.innerHTML = `
    <section class="section">
      <div class="container">
        <div style="display:grid;grid-template-columns:240px 1fr;gap:var(--space-xl);align-items:start">
          <!-- Sidebar profil -->
          <div>
            <div class="sidebar-card" style="text-align:center">
              <div class="avatar avatar--xl" style="background:${data.avatar_color};margin:0 auto var(--space-md)">${avatarInitials(data.name)}</div>
              <h3>${escapeHtml(data.name)}</h3>
              <p class="font-ui text-small text-muted">${orgTypeLabel(data.organisation_type)}</p>
              <p style="font-weight:600;margin-top:4px">${escapeHtml(data.organisation)}</p>
              <p class="text-small text-muted font-ui mt-sm">📍 ${escapeHtml(data.city||'')}</p>
              ${data.website ? `<a href="${escapeHtml(data.website)}" target="_blank" class="font-ui text-small" style="color:var(--color-forest);display:block;margin-top:4px">🔗 ${escapeHtml(data.website.replace('https://','').replace('http://',''))}</a>` : ''}
              <div class="divider"></div>
              <div class="flex justify-between font-ui text-small">
                <span>Formateur</span><strong>${data.formations_as_host}</strong>
              </div>
              <div class="flex justify-between font-ui text-small mt-sm">
                <span>Participant</span><strong>${data.formations_as_traveler}</strong>
              </div>
              ${currentUser && currentUser.id !== data.id ? `
                <button onclick="openMessageCompose('${data.id}','${escapeHtml(data.name)}')"
                  class="btn btn--secondary w-full mt-lg btn--sm">✉ Envoyer un message</button>
              ` : ''}
            </div>
          </div>

          <!-- Contenu -->
          <div>
            ${data.bio ? `<div class="card mb-lg"><p style="font-style:italic;line-height:1.7">"${escapeHtml(data.bio)}"</p></div>` : ''}

            <h3 style="margin-bottom:var(--space-md)">Formations proposées (${formations_offered.length})</h3>
            ${formations_offered.length
              ? `<div class="grid grid--2">${formations_offered.map(f => formationCardHTML({...f, user_name:data.name, organisation:data.organisation, city:data.city, avatar_color:data.avatar_color}, false, currentUser?.id)).join('')}</div>`
              : `<p class="text-muted font-ui text-small mb-lg">Aucune pour l'instant.</p>`}

            <h3 style="margin:var(--space-xl) 0 var(--space-md)">Formations recherchées (${formations_wanted.length})</h3>
            ${formations_wanted.length
              ? `<div class="grid grid--2">${formations_wanted.map(f => formationCardHTML({...f, user_name:data.name, organisation:data.organisation, city:data.city, avatar_color:data.avatar_color}, false, currentUser?.id)).join('')}</div>`
              : `<p class="text-muted font-ui text-small">Aucune pour l'instant.</p>`}
          </div>
        </div>
      </div>
    </section>
  `;
}

// =============================================
// PAGE : MESSAGES
// =============================================
// =============================================
// PAGE : MESSAGES
// =============================================
async function renderMessages(app) {
  const currentUser = Session.getUser();

  app.innerHTML = `
    <div class="section">
      <div class="container">
        <div class="section__header flex justify-between items-center" style="flex-wrap:wrap;gap:var(--space-md)">
          <div>
            <div class="section__eyebrow">Messagerie</div>
            <h2>Messages</h2>
          </div>
          <div style="display:flex;gap:8px">
            <button onclick="refreshMessages()" class="btn btn--sm">↻ Rafraîchir</button>
            <button onclick="openMessageCompose()" class="btn btn--primary btn--sm">+ Nouveau message</button>
          </div>
        </div>
        <div class="messages-layout">
          <div class="messages-list" id="msg-list">
            <div class="empty-state" style="padding:var(--space-xl)"><div class="spinner"></div></div>
          </div>
          <div class="message-detail" id="msg-detail">
            <div class="empty-state"><div class="empty-state__icon">✉️</div><h3>Sélectionnez une conversation</h3></div>
          </div>
        </div>
      </div>
    </div>
  `;

  let inbox = [], sent = [];
  try { [inbox, sent] = await Promise.all([Messages.inbox(), Messages.sent()]); } catch {}

  function buildConversations(inbox, sent, currentUserId) {
    const convMap = {};
    [...inbox, ...sent].filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i).forEach(m => {
      const otherId = m.sender_id === currentUserId ? m.recipient_id : m.sender_id;
      const otherName = m.sender_id === currentUserId ? (m.recipient_name || 'Inconnu') : (m.sender_name || 'Inconnu');
      const otherOrg = m.sender_id === currentUserId ? (m.recipient_org || '') : (m.sender_org || '');
      if (!convMap[otherId]) convMap[otherId] = { otherId, otherName, otherOrg, messages: [], unread: 0 };
      convMap[otherId].messages.push(m);
      if (!m.read && m.recipient_id === currentUserId) convMap[otherId].unread++;
    });
    Object.values(convMap).forEach(c => c.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)));
    return Object.values(convMap).sort((a, b) => {
      const aLast = a.messages[a.messages.length - 1].created_at;
      const bLast = b.messages[b.messages.length - 1].created_at;
      return new Date(bLast) - new Date(aLast);
    });
  }

  let conversations = buildConversations(inbox, sent, currentUser?.id);
  let activeConvId = null;

  function renderConvList() {
    const list = document.getElementById('msg-list');
    if (!conversations.length) {
      list.innerHTML = '<div class="empty-state" style="padding:var(--space-xl)"><p class="font-ui text-small text-muted">Aucune conversation</p></div>';
      return;
    }
    list.innerHTML = conversations.map(c => {
      const last = c.messages[c.messages.length - 1];
      const isActive = c.otherId === activeConvId;
      return '<div class="message-item ' + (c.unread > 0 ? 'unread' : '') + ' ' + (isActive ? 'active' : '') + '" onclick="openConversation(\'' + c.otherId + '\')">'
        + '<div style="display:flex;justify-content:space-between;align-items:center">'
        + '<div class="message-item__subject">' + escapeHtml(c.otherOrg || c.otherName) + '</div>'
        + (c.unread > 0 ? '<span style="background:var(--color-terracotta);color:white;border-radius:999px;font-size:11px;padding:2px 7px;font-weight:600">' + c.unread + '</span>' : '')
        + '</div>'
        + '<div class="message-item__meta">' + escapeHtml(c.otherName) + ' · ' + formatDateShort(last.created_at) + '</div>'
        + '<div style="font-size:0.82rem;color:var(--color-text-muted);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escapeHtml((last.body || '').slice(0,60)) + '…</div>'
        + '</div>';
    }).join('');
  }

  window.openConversation = async (otherId) => {
    activeConvId = otherId;
    renderConvList();
    const conv = conversations.find(c => c.otherId === otherId);
    if (!conv) return;
    for (const m of conv.messages) {
      if (!m.read && m.recipient_id === currentUser?.id) {
        m.read = true;
        try { await Messages.markRead(m.id); } catch {}
      }
    }
    conv.unread = 0;
    refreshUnreadBadge();
    renderConvList();
    const detail = document.getElementById('msg-detail');
    const thread = conv.messages.map(m => {
      const isMine = m.sender_id === currentUser?.id;
      return '<div style="display:flex;flex-direction:column;align-items:' + (isMine ? 'flex-end' : 'flex-start') + '">'
        + '<div style="max-width:75%;background:' + (isMine ? 'var(--color-forest)' : 'white') + ';color:' + (isMine ? 'white' : 'var(--color-text)') + ';border-radius:' + (isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px') + ';padding:10px 14px;border:1px solid ' + (isMine ? 'transparent' : 'var(--color-border)') + '">'
        + '<div style="font-size:0.93rem;white-space:pre-wrap">' + escapeHtml(m.body) + '</div>'
        + '</div>'
        + '<div style="font-size:0.75rem;color:var(--color-text-muted);margin-top:3px">' + formatDateShort(m.created_at) + '</div>'
        + '</div>';
    }).join('');
    detail.innerHTML = '<div style="display:flex;flex-direction:column;height:100%">'
      + '<div style="padding:var(--space-md) var(--space-lg);border-bottom:1px solid var(--color-border)">'
      + '<strong>' + escapeHtml(conv.otherOrg || conv.otherName) + '</strong>'
      + '<span class="text-muted text-small font-ui" style="margin-left:8px">' + escapeHtml(conv.otherName) + '</span>'
      + '</div>'
      + '<div style="background:var(--color-sand);border:1px solid var(--color-border);border-radius:8px;margin:var(--space-md) var(--space-lg);padding:var(--space-md);font-size:0.85rem;color:var(--color-text-muted)">'
      + '<strong style="color:var(--color-forest)">💡 Pour bien organiser votre échange :</strong><br>'
      + 'Précisez la <strong>formation souhaitée</strong>, les <strong>dates envisagées</strong>, le <strong>nombre de participants</strong>, le <strong>lieu</strong> et toute contrainte particulière.'
      + '</div>'
      + '<div id="chat-thread" style="height:500px;overflow-y:auto;padding:var(--space-md) var(--space-lg);display:flex;flex-direction:column;gap:12px">' + thread + '</div>'
      + '<div style="padding:var(--space-md) var(--space-lg);border-top:1px solid var(--color-border);display:flex;gap:8px;align-items:flex-end">'
      + '<textarea id="reply-body" class="form-textarea" rows="2" placeholder="Votre message…" style="flex:1;resize:none" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();sendReply(\'' + otherId + '\')}"></textarea>'
      + '<button class="btn btn--primary" onclick="sendReply(\'' + otherId + '\')">Envoyer</button>'
      + '</div></div>';
    const t = document.getElementById('chat-thread');
    if (t) t.scrollTop = t.scrollHeight;
  };

  window.sendReply = async (recipientId) => {
    const bodyEl = document.getElementById('reply-body');
    const body = bodyEl?.value.trim();
    if (!body) { Toast.error('Écrivez un message'); return; }
    try {
      const msg = await Messages.send({ recipient_id: recipientId, subject: 'Message TrocLab', body });
      bodyEl.value = '';
      const conv = conversations.find(c => c.otherId === recipientId);
      if (conv) { conv.messages.push({ ...msg, sender_id: currentUser?.id, body }); openConversation(recipientId); }
      Toast.success('Message envoyé !');
    } catch (err) { Toast.error(err.message || 'Erreur envoi'); }
  };

  window.refreshMessages = async () => {
    try {
      [inbox, sent] = await Promise.all([Messages.inbox(), Messages.sent()]);
      conversations = buildConversations(inbox, sent, currentUser?.id);
      renderConvList();
      if (activeConvId) openConversation(activeConvId);
      Toast.success('Messages actualisés');
    } catch { Toast.error('Erreur de rafraîchissement'); }
  };

  renderConvList();
}
// =============================================
// MODALS & ACTIONS GLOBALES
// =============================================

// --- Nouvelle formation ---
function openNewFormationModal() {
  if (!Session.isLoggedIn()) { navigate('/connexion'); return; }
  Modal.show('Ajouter une formation', `
    <div id="form-error"></div>
    <div class="form-group mb-md">
      <label class="form-label">Titre *</label>
      <input class="form-input w-full" id="f-title" placeholder="ex: Initiation à la sérigraphie">
    </div>
    <div class="form-group mb-md">
      <label class="form-label">Description *</label>
      <textarea class="form-textarea w-full" id="f-desc" rows="3" placeholder="Décrivez le contenu, le niveau requis, le matériel fourni…"></textarea>
    </div>
    <div class="form-group mb-md">
      <label class="form-label">Catégorie *</label>
      <select class="form-select w-full" id="f-cat">
  <option value="">-- Choisir une catégorie --</option>
  <option value="Fabrication">Fabrication</option>
  <option value="Numérique & tech">Numérique & tech</option>
  <option value="Communication & design">Communication & design</option>
  <option value="Gestion & comptabilité">Gestion & comptabilité</option>
  <option value="Animation & médiation">Animation & médiation</option>
  <option value="Écologie & transitions">Écologie & transitions</option>
  <option value="Arts appliqués">Arts appliqués</option>
  <option value="Gestion de projet">Gestion de projet</option>
  <option value="Management associatif">Management associatif</option>
  <option value="Juridique & administratif">Juridique & administratif</option>
  <option value="Autre">Autre</option>
</select>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md)" class="mb-md">
      <div class="form-group">
        <label class="form-label">Durée (heures)</label>
        <input class="form-input w-full" type="number" id="f-duration" value="3" min="1" max="40">
      </div>
      <div class="form-group">
        <label class="form-label">Participants max</label>
        <input class="form-input w-full" type="number" id="f-participants" value="8" min="1" max="50">
      </div>
    </div>
    <div class="form-group mb-lg">
      <label class="form-label">Type *</label>
      <select class="form-select w-full" id="f-type">
        <option value="offered">🌱 Je propose cette formation</option>
        <option value="wanted">🔍 Je recherche cette formation</option>
      </select>
    </div>
  `, `
    <button class="btn btn--primary w-full" onclick="submitNewFormation()">Publier la formation</button>
  `);
}

async function submitNewFormation() {
  const title = document.getElementById('f-title')?.value.trim();
  const desc = document.getElementById('f-desc')?.value.trim();
  const category = document.getElementById('f-cat')?.value;
  const type = document.getElementById('f-type')?.value;
  const duration = document.getElementById('f-duration')?.value;
  const participants = document.getElementById('f-participants')?.value;
  const errEl = document.getElementById('form-error');

  if (!title || !desc || !category || !type) {
    errEl.innerHTML = `<div class="alert alert--error mb-md">Remplissez tous les champs obligatoires.</div>`;
    return;
  }

  // Confirmation avant publication
  Modal.show('Avant de publier', `
    <div style="font-family:var(--font-ui);line-height:1.7">
      <p style="margin-bottom:var(--space-md)">En publiant cette formation, vous confirmez qu'elle respecte les règles de TrocLab :</p>
      <ul style="margin-bottom:var(--space-md);padding-left:var(--space-lg)">
        <li>✅ La formation est <strong>gratuite</strong> — TrocLab repose sur le troc</li>
        <li>✅ Le contenu est <strong>réel et réalisable</strong> par votre structure</li>
        <li>✅ La description est <strong>claire et honnête</strong></li>
      </ul>
      <div style="background:#FFF3CD;border-radius:var(--radius-md);padding:var(--space-md);font-size:0.85rem;margin-bottom:var(--space-lg)">
        ⚠️ <strong>Attention :</strong> toute formation ne respectant pas ces conditions pourra être retirée du catalogue par l'équipe TrocLab, qui privilégie la sécurité et la facilité d'usage de ses membres.
      </div>
      <button class="btn btn--primary w-full" onclick="confirmPublishFormation('${type}','${encodeURIComponent(title)}','${encodeURIComponent(desc)}','${encodeURIComponent(category)}',${duration},${participants})">
        ✅ Je confirme et publie la formation
      </button>
    </div>
  `);
}

async function confirmPublishFormation(type, title, desc, category, duration, participants) {
  try {
    const res = await fetch('/api/formations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('troclab_token')}` },
      body: JSON.stringify({
        title: decodeURIComponent(title),
        description: decodeURIComponent(desc),
        category: decodeURIComponent(category),
        type, duration_hours: duration, max_participants: participants
      })
    });
    const data = await res.json();
    if (!res.ok) throw data;
    Modal.close();
    Toast.success('Formation publiée !');
    navigate('/catalogue');
  } catch (err) {
    Toast.error(err.error || err.message || 'Erreur');
  }
}

// --- Modifier formation ---
async function editFormation(id) {
  let formations;
  try { formations = await Formations.mine(); } catch { return; }
  const f = formations.find(x => x.id === id);
  if (!f) return;

  Modal.show('Modifier la formation', `
    <div id="edit-error"></div>
    <div class="form-group mb-md">
      <label class="form-label">Titre</label>
      <input class="form-input w-full" id="ef-title" value="${escapeHtml(f.title)}">
    </div>
    <div class="form-group mb-md">
      <label class="form-label">Description</label>
      <textarea class="form-textarea w-full" id="ef-desc" rows="3">${escapeHtml(f.description)}</textarea>
    </div>
    <div class="form-group mb-md">
      <label class="form-label">Catégorie</label>
      <select class="form-select w-full" id="ef-cat">
  <option value="">-- Catégorie --</option>
<option value="Fabrication">Fabrication</option>
<option value="Numérique">Numérique</option>
<option value="Com & design">Com & design</option>
<option value="Gestion">Gestion</option>
<option value="Juridique">Juridique</option>
<option value="Administratif">Administratif</option>
<option value="Relationnel">Relationnel</option>
<option value="Animation">Animation</option>
<option value="Écologie">Écologie</option>
<option value="Arts appliqués">Arts appliqués</option>
<option value="Autre">Autre</option>
</select>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md)" class="mb-lg">
      <div class="form-group">
        <label class="form-label">Durée (h)</label>
        <input class="form-input w-full" type="number" id="ef-dur" value="${f.duration_hours}">
      </div>
      <div class="form-group">
        <label class="form-label">Participants max</label>
        <input class="form-input w-full" type="number" id="ef-par" value="${f.max_participants}">
      </div>
    </div>
  `, `
    <button class="btn btn--primary w-full" onclick="submitEditFormation('${id}')">Enregistrer</button>
  `);
}

async function submitEditFormation(id) {
  const payload = {
    title: document.getElementById('ef-title')?.value.trim(),
    description: document.getElementById('ef-desc')?.value.trim(),
    category: document.getElementById('ef-cat')?.value.trim(),
    duration_hours: parseInt(document.getElementById('ef-dur')?.value),
    max_participants: parseInt(document.getElementById('ef-par')?.value),
  };
  try {
    await Formations.update(id, payload);
    Modal.close();
    Toast.success('Formation mise à jour');
    renderPage('/tableau-de-bord');
  } catch (err) {
    document.getElementById('edit-error').innerHTML = `<div class="alert alert--error mb-md">${err.message}</div>`;
  }
}

async function deleteFormation(id) {
  if (!confirm('Supprimer cette formation ?')) return;
  try {
    await Formations.delete(id);
    Toast.success('Formation supprimée');
    renderPage('/tableau-de-bord');
  } catch (err) { Toast.error(err.message); }
}

// --- Demande d'échange ---
function openExchangeRequest(formationId, hostId, title) {
  if (!Session.isLoggedIn()) { navigate('/connexion'); return; }
  Modal.show(`Demander "${escapeHtml(title)}"`, `
    <div id="exch-error"></div>
    <p class="font-ui text-small text-muted mb-md">Envoyez une demande d'échange. Le formateur sera notifié et pourra accepter ou refuser.</p>
    <div class="form-group mb-md">
      <label class="form-label">Date souhaitée (optionnel)</label>
      <input class="form-input w-full" type="date" id="ex-date">
    </div>
    <div class="form-group mb-lg">
      <label class="form-label">Message (optionnel)</label>
      <textarea class="form-textarea w-full" id="ex-notes" rows="3" placeholder="Présentez-vous, précisez vos attentes…"></textarea>
    </div>
  `, `
    <button class="btn btn--primary w-full" onclick="submitExchangeRequest('${formationId}')">Envoyer la demande</button>
  `);
}

async function submitExchangeRequest(formationId) {
  const payload = {
    formation_id: formationId,
    date_proposed: document.getElementById('ex-date')?.value || null,
    notes: document.getElementById('ex-notes')?.value.trim() || '',
  };
  try {
    await Exchanges.create(payload);
    Modal.close();
    Toast.success('Demande envoyée !');
  } catch (err) {
    if (err.data?.imbalance_error) {
      Modal.close();
      Modal.show('Déséquilibre détecté', `
        <div class="alert alert--warning">${err.message}</div>
        <p class="font-ui text-small mt-md">Ajoutez des formations à proposer pour rééquilibrer votre compte.</p>
      `, `<button class="btn btn--primary w-full" onclick="Modal.close();navigate('/tableau-de-bord')">Voir mon espace</button>`);
    } else {
      document.getElementById('exch-error').innerHTML = `<div class="alert alert--error mb-md">${err.message}</div>`;
    }
  }
}

async function updateExchangeStatus(id, status) {
  try {
    await Exchanges.updateStatus(id, status);
    Toast.success(status === 'completed' ? 'Échange marqué comme terminé !' : 'Statut mis à jour');
    renderPage('/tableau-de-bord');
  } catch (err) { Toast.error(err.message); }
}

// --- Message ---
async function openMessageCompose(recipientId = '', recipientName = '', subject = '') {
  if (!Session.isLoggedIn()) { navigate('/connexion'); return; }
  
  const currentUser = Session.getUser();
  let users = [];
  try { users = await Users.list(); } catch {}
  const others = users.filter(u => u.id !== currentUser.id);

  Modal.show('Nouveau message', `
    <div id="msg-error"></div>
    <div class="form-group mb-md">
      <label class="form-label">Destinataire</label>
      <select class="form-select w-full" id="mc-recipient">
        <option value="">-- Choisir une structure --</option>
        ${others.map(u => `<option value="${u.id}" ${u.id === recipientId ? 'selected' : ''}>${escapeHtml(u.organisation)} — ${escapeHtml(u.name)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group mb-md">
      <label class="form-label">Objet</label>
      <input class="form-input w-full" id="mc-subject" value="${escapeHtml(subject)}" placeholder="Proposition d'échange…">
    </div>
    <div class="form-group mb-lg">
      <label class="form-label">Message *</label>
      <textarea class="form-textarea w-full" id="mc-body" rows="5" placeholder="Bonjour, je suis intéressé par…"></textarea>
    </div>
  `, `<button class="btn btn--primary w-full" onclick="submitMessage()">Envoyer</button>`);
}

async function submitMessage() {
  const payload = {
    recipient_id: document.getElementById('mc-recipient')?.value.trim(),
    subject: document.getElementById('mc-subject')?.value.trim(),
    body: document.getElementById('mc-body')?.value.trim(),
  };
  if (!payload.recipient_id || !payload.body) {
    document.getElementById('msg-error').innerHTML = `<div class="alert alert--error mb-md">Destinataire et message requis.</div>`;
    return;
  }
  try {
    await Messages.send(payload);
    Modal.close();
    Toast.success('Message envoyé !');
    if (window.location.pathname === '/messages') renderPage('/messages');
  } catch (err) {
    document.getElementById('msg-error').innerHTML = `<div class="alert alert--error mb-md">${err.message}</div>`;
  }
}

// --- Upgrade ---
function openUpgradeModal() {
  Modal.show('Passer à Premium', `
    <div class="text-center mb-lg">
      <div style="font-size:2.5rem;margin-bottom:var(--space-md)">🌿</div>
      <h3>Abonnement annuel TrocLab</h3>
      <div style="font-family:var(--font-display);font-size:3rem;color:var(--color-forest);margin:var(--space-md) 0">50€<span style="font-size:1rem;color:var(--color-text-muted);font-family:var(--font-ui)">/an — soit 4,17€/mois</span></div>
    </div>
    <div class="pricing-feature">Formations illimitées</div>
    <div class="pricing-feature">Messagerie interne complète</div>
    <div class="pricing-feature">Apparition sur la carte</div>
    <div class="pricing-feature">Soutien au projet</div>
    <div class="alert alert--info mt-lg">
      <span>ℹ️</span>
      <span>Le paiement en ligne sera disponible prochainement. Contactez-nous à <a href="mailto:alexane.groussard@gmail.com" style="color:var(--color-sky)">alexane.groussard@gmail.com</a> pour vous abonner.</span>
    </div>
  `);
}

// =============================================
// 404
// =============================================
function render404() {
  return `<div class="section"><div class="container--narrow text-center">
    <div style="font-size:4rem;margin-bottom:var(--space-lg)">🌿</div>
    <h2>Page introuvable</h2>
    <p class="text-muted font-ui mt-md">Cette page n'existe pas ou a été déplacée.</p>
    <a href="/" class="btn btn--primary mt-xl">Retour à l'accueil</a>
  </div></div>`;
}

// =============================================
// INITIALISATION
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  renderNav();
  renderPage(window.location.pathname);
});

// =============================================
// PAGE : ALERTES
// =============================================
async function renderAlertes(app) {
  if (!Session.isLoggedIn()) { navigate('/connexion'); return; }
  app.innerHTML = `
    <div class="section">
      <div class="container">
        <div class="section__header">
          <div class="section__eyebrow">Mon espace</div>
          <h2>Mes alertes</h2>
          <p class="text-muted font-ui" style="margin-top:8px">Configurez des alertes pour trouver les formations qui vous intéressent.</p>
        </div>
        <div class="card" style="max-width:520px;margin-bottom:var(--space-xl)">
          <h4 style="margin-bottom:var(--space-md)">Nouvelle alerte</h4>
          <div id="alert-error"></div>
          <div class="form-group mb-md">
            <label class="form-label">Catégorie</label>
            <input class="form-input w-full" id="alert-category" placeholder="ex: Fabrication numérique…">
          </div>
          <div class="form-group mb-lg">
            <label class="form-label">Mot-clé</label>
            <input class="form-input w-full" id="alert-keyword" placeholder="ex: sérigraphie, Arduino…">
          </div>
          <p class="form-hint mb-lg">Remplissez l'un ou l'autre, ou les deux.</p>
          <button class="btn btn--primary" onclick="submitAlert()">+ Ajouter l'alerte</button>
        </div>
        <h3 style="margin-bottom:var(--space-md)">Alertes configurées</h3>
        <div id="alerts-list" style="margin-bottom:var(--space-xl)">
          <div class="empty-state"><div class="spinner"></div></div>
        </div>
        <h3 style="margin-bottom:var(--space-md)">Formations correspondantes</h3>
        <div id="alerts-matches" class="grid grid--2">
          <div class="empty-state" style="grid-column:1/-1"><div class="spinner"></div></div>
        </div>
      </div>
    </div>
  `;
  loadAlertes();
}

async function loadAlertes() {
  try {
    const token = localStorage.getItem('troclab_token');
    const headers = { Authorization: `Bearer ${token}` };
    const [alerts, matches] = await Promise.all([
      fetch('/api/alerts', { headers }).then(r => r.json()),
      fetch('/api/alerts/matches', { headers }).then(r => r.json()),
    ]);
    const alertsList = document.getElementById('alerts-list');
    if (alertsList) alertsList.innerHTML = alerts.length
      ? alerts.map(a => `
          <div class="card mb-md flex items-center justify-between" style="flex-wrap:wrap;gap:var(--space-md)">
            <div class="flex gap-md" style="flex-wrap:wrap">
              ${a.category ? `<span class="category-tag">📂 ${escapeHtml(a.category)}</span>` : ''}
              ${a.keyword ? `<span class="category-tag">🔑 ${escapeHtml(a.keyword)}</span>` : ''}
            </div>
            <button onclick="deleteAlert('${a.id}')" class="btn btn--danger btn--sm">Supprimer</button>
          </div>`).join('')
      : `<div class="empty-state card"><div class="empty-state__icon">🔔</div><h3>Aucune alerte</h3><p>Ajoutez une alerte pour suivre les formations qui vous intéressent.</p></div>`;
    const matchesEl = document.getElementById('alerts-matches');
    const user = Session.getUser();
    if (matchesEl) matchesEl.innerHTML = matches.length
      ? matches.map(f => formationCardHTML(f, false, user?.id)).join('')
      : `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">🌱</div><h3>Aucune formation correspondante</h3><p>Aucune formation ne correspond à vos alertes pour l'instant.</p></div>`;
  } catch (err) {
    Toast.error('Erreur lors du chargement des alertes');
  }
}

async function submitAlert() {
  const category = document.getElementById('alert-category')?.value.trim();
  const keyword = document.getElementById('alert-keyword')?.value.trim();
  const errEl = document.getElementById('alert-error');
  if (!category && !keyword) {
    errEl.innerHTML = `<div class="alert alert--error mb-md">Remplissez au moins un champ.</div>`;
    return;
  }
  try {
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('troclab_token')}` },
      body: JSON.stringify({ category, keyword })
    });
    if (!res.ok) throw await res.json();
    document.getElementById('alert-category').value = '';
    document.getElementById('alert-keyword').value = '';
    errEl.innerHTML = '';
    Toast.success('Alerte ajoutée !');
    loadAlertes();
  } catch (err) {
    if (errEl) errEl.innerHTML = `<div class="alert alert--error mb-md">${err.error || 'Erreur'}</div>`;
  }
}

async function deleteAlert(id) {
  try {
    await fetch(`/api/alerts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('troclab_token')}` }
    });
    Toast.success('Alerte supprimée');
    loadAlertes();
  } catch {
    Toast.error('Erreur lors de la suppression');
  }
}

// =============================================
// DASHBOARD : ONGLET ALERTES
// =============================================
async function renderDashAlerts(el) {
  el.innerHTML = `
    <div class="card" style="max-width:520px;margin-bottom:var(--space-xl)">
      <h4 style="margin-bottom:var(--space-md)">Nouvelle alerte</h4>
      <div id="alert-error"></div>
      <div class="form-group mb-md">
        <label class="form-label">Catégorie</label>
        <input class="form-input w-full" id="alert-category" placeholder="ex: Fabrication numérique…">
      </div>
      <div class="form-group mb-lg">
        <label class="form-label">Mot-clé</label>
        <input class="form-input w-full" id="alert-keyword" placeholder="ex: sérigraphie, Arduino…">
      </div>
      <p class="form-hint mb-lg">Remplissez l'un ou l'autre, ou les deux.</p>
      <button class="btn btn--primary" onclick="submitAlert()">+ Ajouter l'alerte</button>
    </div>
    <h3 style="margin-bottom:var(--space-md)">Alertes configurées</h3>
    <div id="alerts-list" style="margin-bottom:var(--space-xl)">
      <div class="empty-state"><div class="spinner"></div></div>
    </div>
    <h3 style="margin-bottom:var(--space-md)">Formations correspondantes</h3>
    <div id="alerts-matches" class="grid grid--2">
      <div class="empty-state" style="grid-column:1/-1"><div class="spinner"></div></div>
    </div>
  `;
  loadAlertes();
}

async function renderFormation(app) {
  const id = window.location.pathname.split('/').pop();
  app.innerHTML = `<div class="section"><div class="container" style="max-width:700px">
    <button onclick="history.back()" class="btn btn--ghost btn--sm" style="margin-bottom:var(--space-lg)">← Retour</button>
    <div id="formation-detail"><div class="empty-state"><div class="spinner"></div></div></div>
  </div></div>`;
  try {
    const res = await fetch(`/api/formations/${id}`);
    if (!res.ok) throw new Error();
    const f = await res.json();
    const user = Session.getUser();
    const isOwn = f.user_id === user?.id;
    document.getElementById('formation-detail').innerHTML = `
      <div class="card" style="gap:var(--space-md)">
        <div class="flex items-center justify-between gap-md" style="flex-wrap:wrap">
          ${formationTypeHTML(f.type)}
          <span class="category-tag">${escapeHtml(f.category)}</span>
        </div>
        <h2 style="margin:0">${escapeHtml(f.title)}</h2>
        <p style="line-height:1.7;white-space:pre-wrap">${escapeHtml(f.description)}</p>
        <div class="flex gap-lg text-small text-muted font-ui" style="flex-wrap:wrap;padding:var(--space-md) 0;border-top:1px solid var(--color-border);border-bottom:1px solid var(--color-border)">
          <span>⏱ ${f.duration_hours}h</span>
          <span>👥 ${f.max_participants} participants max</span>
          ${f.city ? `<span>📍 ${escapeHtml(f.city)}</span>` : ''}
        </div>
        ${f.user_name ? `
          <div class="flex items-center gap-md" style="flex-wrap:wrap">
            <a href="/profil/${f.user_id}" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:inherit;flex:1">
              <div class="avatar" style="background:${f.avatar_color||'#2D6A4F'}">${avatarInitials(f.user_name)}</div>
              <div>
                <div class="font-ui" style="font-weight:600">${escapeHtml(f.organisation||'')}</div>
                <div class="font-ui text-small text-muted">${escapeHtml(f.user_name)}</div>
              </div>
            </a>
            ${!isOwn && f.type === 'offered' ? `
              <button onclick="openMessageCompose('${f.user_id}','${escapeHtml(f.user_name)}')" class="btn btn--primary">Contacter la structure</button>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  } catch {
    document.getElementById('formation-detail').innerHTML = `<div class="empty-state"><h3>Formation introuvable</h3></div>`;
  }
}

async function renderDashAdmin(el) {
  const user = Session.getUser();
  if (!user?.is_admin) {
    el.innerHTML = `<div class="empty-state"><h3>Accès refusé</h3></div>`;
    return;
  }
  el.innerHTML = `<div class="spinner"></div>`;
  try {
    const token = localStorage.getItem('troclab_token');
    const [formations, users] = await Promise.all([
      fetch('/api/formations?all=true', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]);
    el.innerHTML = `
      <h3 style="margin-bottom:var(--space-lg)">Modération</h3>
      <h4 style="margin-bottom:var(--space-md)">Formations (${formations.length})</h4>
      <div style="display:flex;flex-direction:column;gap:var(--space-sm);margin-bottom:var(--space-xl)">
        ${formations.map(f => `
          <div class="card" style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-md);flex-wrap:wrap;padding:var(--space-md)">
            <div>
              <a href="/formation/${f.id}" style="font-weight:600;font-family:var(--font-ui);font-size:0.875rem;color:var(--color-forest)">${escapeHtml(f.title)}</a>
              <a href="/profil/${f.user_id}" style="font-size:0.875rem;font-family:var(--font-ui);color:var(--color-text-muted)">${escapeHtml(f.organisation||'')} — ${escapeHtml(f.category)}</a>
            </div>
            <button onclick="adminDeleteFormation('${f.id}')" class="btn btn--danger btn--sm">Supprimer</button>
          </div>
        `).join('')}
      </div>
      <h4 style="margin-bottom:var(--space-md)">Utilisateurs (${users.length})</h4>
      <div style="display:flex;flex-direction:column;gap:var(--space-sm)">
        ${users.map(u => `
          <div class="card" style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-md);flex-wrap:wrap;padding:var(--space-md)">
            <div>
              <div class="font-ui text-small" style="font-weight:600">${escapeHtml(u.name)}</div>
              <div class="font-ui text-small text-muted">${escapeHtml(u.organisation||'')} — ${escapeHtml(u.email||'')}</div>
            </div>
            <button onclick="adminDeleteUser('${u.id}')" class="btn btn--danger btn--sm">Supprimer</button>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    el.innerHTML = `<div class="empty-state"><h3>Erreur : ${err.message}</h3></div>`;
  }
}

async function adminDeleteFormation(id) {
  if (!confirm('Supprimer cette formation ?')) return;
  const token = localStorage.getItem('troclab_token');
  await fetch(`/api/formations/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  Toast.success('Formation supprimée');
  document.querySelector('[data-tab="admin"]').click();
}

async function adminDeleteUser(id) {
  if (!confirm('Supprimer cet utilisateur ?')) return;
  const token = localStorage.getItem('troclab_token');
  await fetch(`/api/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  Toast.success('Utilisateur supprimé');
  document.querySelector('[data-tab="admin"]').click();
}
