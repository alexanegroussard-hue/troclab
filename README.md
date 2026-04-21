# TrocLab — Plateforme de troc de formations

> Échangez des formations entre structures associatives et solidaires, sur un principe de réciprocité.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Backend | Node.js + Express |
| Base de données | sql.js (SQLite en mémoire + persistance fichier) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Frontend | HTML/CSS/JS vanilla (SPA) — aucun framework |
| Carte | Leaflet.js + OpenStreetMap |
| Polices | Google Fonts (Playfair Display, Source Serif 4, DM Sans) |

---

## Structure du projet

```
troclab/
├── backend/
│   ├── server.js          # Point d'entrée Express
│   ├── db.js              # Initialisation BDD + données démo
│   ├── middleware/
│   │   └── auth.js        # Middleware JWT
│   └── routes/
│       ├── auth.js        # Inscription / Connexion / Profil
│       ├── users.js       # Utilisateurs & carte
│       ├── formations.js  # CRUD formations
│       ├── exchanges.js   # Demandes d'échange + équilibre
│       └── messages.js    # Messagerie interne
└── frontend/
    └── public/
        ├── index.html     # Shell SPA
        ├── css/
        │   └── style.css  # Design system complet (variables configurables)
        └── js/
            ├── api.js     # Client HTTP vers l'API
            ├── ui.js      # Composants UI (Toast, Modal, helpers)
            └── app.js     # Routeur SPA + toutes les pages
```

---

## Installation et lancement

### Prérequis
- Node.js ≥ 18

### 1. Installer les dépendances

```bash
cd backend
npm install
```

### 2. Lancer le serveur

```bash
node server.js
# ou en mode développement :
npm run dev
```

### 3. Ouvrir dans le navigateur

```
http://localhost:3001
```

---

## Comptes de démonstration

| Email | Mot de passe | Structure |
|-------|-------------|-----------|
| alice@fablab-paris.org | password | FabLab Paris Centre |
| ben@asso-solidaire.fr | password | Réseau Solidaire 13 |
| celia@ecosol-lyon.coop | password | EcoSol Lyon |
| david@maison-quartier.fr | password | Maison de Quartier Bellecour |
| emma@tiers-lieu-bx.org | password | Tiers-Lieu Bordeaux Sud |

---

## Configuration

### Couleurs du site

Toutes les couleurs sont définies dans `/frontend/public/css/style.css`, section `:root` :

```css
:root {
  --color-forest: #2D6A4F;       /* Couleur principale */
  --color-forest-dark: #1B4332;  /* Couleur principale foncée */
  --color-terracotta: #E76F51;   /* Couleur d'accent */
  --color-cream: #F5F0E8;        /* Fond général */
  /* ... */
}
```

### Polices

```css
:root {
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'Source Serif 4', 'Georgia', serif;
  --font-ui: 'DM Sans', system-ui, sans-serif;
}
```

### Textes

Tous les textes sont directement dans les fichiers JS (fonctions `render*()`).
Recherchez les chaînes en français dans `app.js` pour les modifier.

### Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `PORT` | 3001 | Port du serveur |
| `JWT_SECRET` | `troclab-secret-...` | **Changer en production** |
| `FRONTEND_URL` | `*` | URL du frontend pour CORS |

---

## API REST

### Auth
```
POST /api/auth/register    Inscription
POST /api/auth/login       Connexion → { token, user }
GET  /api/auth/me          Profil (auth requis)
```

### Utilisateurs
```
GET  /api/users            Liste publique (pour la carte)
GET  /api/users/:id        Profil public + formations
PUT  /api/users/me         Modifier son profil (auth)
```

### Formations
```
GET    /api/formations            Catalogue (?type= &category= &search=)
GET    /api/formations/mine       Mes formations (auth)
POST   /api/formations            Créer (auth)
PUT    /api/formations/:id        Modifier (auth, propriétaire)
DELETE /api/formations/:id        Archiver (auth, propriétaire)
```

### Échanges
```
GET  /api/exchanges               Mes échanges (auth)
POST /api/exchanges               Demander un échange (auth)
PUT  /api/exchanges/:id/status    Changer le statut (auth)
```

### Messages
```
GET  /api/messages                Boîte de réception (auth)
GET  /api/messages/sent           Messages envoyés (auth)
GET  /api/messages/unread-count   Compteur non-lus (auth)
POST /api/messages                Envoyer (auth)
PUT  /api/messages/:id/read       Marquer lu (auth)
```

---

## Logique métier clé

### Règle d'équilibre voyageur/hôte

```
formations_as_traveler - formations_as_host ≤ 5
```

Si un utilisateur dépasse 5 formations reçues de plus que données,
ses nouvelles demandes d'échange sont bloquées jusqu'à rééquilibrage.

### Modèle freemium

- **Gratuit** : jusqu'à 2 formations publiées
- **Premium (30€/an)** : formations illimitées

La limite est vérifiée côté backend à chaque création de formation.

---

## Déploiement en production

1. Changez `JWT_SECRET` dans les variables d'environnement
2. Configurez `FRONTEND_URL` avec votre domaine
3. Ajoutez un reverse proxy (nginx/Caddy) devant Node.js
4. La base de données sqlite est persistée dans `backend/troclab.db`
5. Pensez à sauvegarder régulièrement ce fichier

---

## Développements futurs suggérés

- Paiement en ligne (Stripe) pour l'abonnement
- Notifications email (Nodemailer)
- Géolocalisation automatique à l'inscription
- Système d'évaluation post-formation
- API d'export CSV pour les structures
- Mode hors-ligne (PWA)
