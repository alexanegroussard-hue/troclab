/**
 * TrocLab - Module base de données (sql.js)
 * Toutes les tables et données de démonstration sont initialisées ici.
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'troclab.db');

let db = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  // Charger la base existante ou en créer une nouvelle
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    initSchema();
    seedData();
    saveDb();
  }

  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      organisation TEXT NOT NULL,
      organisation_type TEXT DEFAULT 'association',
      bio TEXT DEFAULT '',
      latitude REAL DEFAULT 48.8566,
      longitude REAL DEFAULT 2.3522,
      city TEXT DEFAULT 'Paris',
      subscription TEXT DEFAULT 'free',
      subscription_expires TEXT,
      formations_as_traveler INTEGER DEFAULT 0,
      formations_as_host INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      avatar_color TEXT DEFAULT '#2D6A4F'
    );

    CREATE TABLE IF NOT EXISTS formations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      duration_hours INTEGER DEFAULT 2,
      max_participants INTEGER DEFAULT 10,
      type TEXT CHECK(type IN ('offered','wanted')) NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS exchanges (
      id TEXT PRIMARY KEY,
      traveler_id TEXT NOT NULL,
      host_id TEXT NOT NULL,
      formation_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      date_proposed TEXT,
      date_confirmed TEXT,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (traveler_id) REFERENCES users(id),
      FOREIGN KEY (host_id) REFERENCES users(id),
      FOREIGN KEY (formation_id) REFERENCES formations(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      recipient_id TEXT NOT NULL,
      exchange_id TEXT,
      subject TEXT DEFAULT '',
      body TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (recipient_id) REFERENCES users(id)
    );
  `);
}

function seedData() {
  const { v4: uuidv4 } = require('uuid');
  const bcrypt = require('bcryptjs');

  const password = bcrypt.hashSync('demo1234', 10);

  const users = [
    {
      id: uuidv4(), email: 'alice@fablab-paris.org', password,
      name: 'Alice Martin', organisation: 'FabLab Paris Centre', organisation_type: 'fablab',
      bio: 'Responsable formation au FabLab. Passionnée de fabrication numérique et d\'impression 3D.',
      latitude: 48.8566, longitude: 2.3522, city: 'Paris', subscription: 'premium',
      formations_as_traveler: 3, formations_as_host: 2, avatar_color: '#2D6A4F'
    },
    {
      id: uuidv4(), email: 'ben@asso-solidaire.fr', password,
      name: 'Benjamin Dubois', organisation: 'Réseau Solidaire 13', organisation_type: 'association',
      bio: 'Coordinateur d\'une association d\'insertion. On cherche à monter en compétences sur le numérique.',
      latitude: 48.8334, longitude: 2.3298, city: 'Paris 13e', subscription: 'free',
      formations_as_traveler: 1, formations_as_host: 0, avatar_color: '#E76F51'
    },
    {
      id: uuidv4(), email: 'celia@ecosol-lyon.coop', password,
      name: 'Célia Rousseau', organisation: 'EcoSol Lyon', organisation_type: 'coop',
      bio: 'Co-fondatrice d\'une SCOP d\'économie circulaire. Formatrice en gestion et communication.',
      latitude: 45.7640, longitude: 4.8357, city: 'Lyon', subscription: 'premium',
      formations_as_traveler: 2, formations_as_host: 4, avatar_color: '#457B9D'
    },
    {
      id: uuidv4(), email: 'david@maison-quartier.fr', password,
      name: 'David Lefort', organisation: 'Maison de Quartier Bellecour', organisation_type: 'association',
      bio: 'Animation socioculturelle, on a des locaux et envie de partager des savoirs.',
      latitude: 45.7578, longitude: 4.8320, city: 'Lyon', subscription: 'free',
      formations_as_traveler: 0, formations_as_host: 1, avatar_color: '#9B2335'
    },
    {
      id: uuidv4(), email: 'emma@tiers-lieu-bx.org', password,
      name: 'Emma Petit', organisation: 'Tiers-Lieu Bordeaux Sud', organisation_type: 'tiers-lieu',
      bio: 'Gestionnaire d\'un tiers-lieu hybride. On fait du coworking, du making et de l\'agriculture urbaine.',
      latitude: 44.8378, longitude: -0.5792, city: 'Bordeaux', subscription: 'premium',
      formations_as_traveler: 5, formations_as_host: 4, avatar_color: '#6B705C'
    },
  ];

  const userIds = [];
  users.forEach(u => {
    db.run(
      `INSERT INTO users (id, email, password, name, organisation, organisation_type, bio, latitude, longitude, city, subscription, formations_as_traveler, formations_as_host, avatar_color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.email, u.password, u.name, u.organisation, u.organisation_type, u.bio,
       u.latitude, u.longitude, u.city, u.subscription, u.formations_as_traveler, u.formations_as_host, u.avatar_color]
    );
    userIds.push(u.id);
  });

  const formations = [
    // Alice - FabLab Paris
    { id: uuidv4(), user_id: userIds[0], title: 'Initiation à l\'impression 3D', description: 'Découverte des bases de l\'impression 3D FDM : modélisation simple, tranchage, calibration d\'une imprimante. Matériel fourni.', category: 'Fabrication num.', duration_hours: 4, max_participants: 6, type: 'offered' },
    { id: uuidv4(), user_id: userIds[0], title: 'Découpe laser pour débutants', description: 'Prise en main d\'une machine de découpe laser. On aborde la conception de fichiers et la sécurité.', category: 'Fabrication num.', duration_hours: 3, max_participants: 4, type: 'offered' },
    { id: uuidv4(), user_id: userIds[0], title: 'Gestion bénévole et engagement', description: 'On cherche une formation pour mieux fidéliser et mobiliser nos bénévoles sur la durée.', category: 'Manag. associatif', duration_hours: 3, max_participants: 8, type: 'wanted' },

    // Benjamin - Réseau Solidaire
    { id: uuidv4(), user_id: userIds[1], title: 'Ateliers insertion numérique', description: 'Ateliers pratiques pour des publics éloignés du numérique : email, démarches en ligne, smartphone.', category: 'Num. inclusif', duration_hours: 2, max_participants: 8, type: 'offered' },
    { id: uuidv4(), user_id: userIds[1], title: 'Création de site web associatif', description: 'On cherche une formation pour créer notre propre site web sans coder.', category: 'Comm.', duration_hours: 4, max_participants: 5, type: 'wanted' },

    // Célia - EcoSol Lyon
    { id: uuidv4(), user_id: userIds[2], title: 'Communication non-violente en équipe', description: 'Atelier pratique sur la CNV pour améliorer la communication interne des structures collectives.', category: 'Comm.', duration_hours: 6, max_participants: 12, type: 'offered' },
    { id: uuidv4(), user_id: userIds[2], title: 'Comptabilité associative simplifiée', description: 'Bases de la compta asso : bilan, compte de résultat, suivi budgétaire. Pour les trésoriers non-comptables.', category: 'Gestion', duration_hours: 4, max_participants: 8, type: 'offered' },
    { id: uuidv4(), user_id: userIds[2], title: 'Fabrication de mobilier upcyclé', description: 'On voudrait apprendre à fabriquer du mobilier à partir de palettes et matériaux récupérés.', category: 'Fabrication', duration_hours: 8, max_participants: 6, type: 'wanted' },

    // David - Maison de Quartier
    { id: uuidv4(), user_id: userIds[3], title: 'Animation d\'ateliers créatifs', description: 'Méthodes d\'animation d\'ateliers créatifs pour tous publics (enfants, adultes, séniors).', category: 'Animation', duration_hours: 4, max_participants: 10, type: 'offered' },
    { id: uuidv4(), user_id: userIds[3], title: 'Montage de dossiers de subvention', description: 'On cherche une formation pour apprendre à rédiger des dossiers de demande de subvention.', category: 'Gestion', duration_hours: 3, max_participants: 6, type: 'wanted' },

    // Emma - Tiers-Lieu Bordeaux
    { id: uuidv4(), user_id: userIds[4], title: 'Maraîchage urbain et permaculture', description: 'Introduction à la permaculture appliquée aux espaces urbains : potager sur toit, jardinage en bacs.', category: 'Écolo. pratique', duration_hours: 4, max_participants: 8, type: 'offered' },
    { id: uuidv4(), user_id: userIds[4], title: 'Gestion de projet Agile pour associations', description: 'Méthode Kanban et Agile adaptées aux structures associatives. Outils libres et gratuits.', category: 'Gestion de projet', duration_hours: 3, max_participants: 10, type: 'offered' },
    { id: uuidv4(), user_id: userIds[4], title: 'Sérigraphie textile', description: 'On cherche une initiation à la sérigraphie pour créer nos propres supports de communication textiles.', category: 'Arts appliqués', duration_hours: 5, max_participants: 6, type: 'wanted' },
  ];

  formations.forEach(f => {
    db.run(
      `INSERT INTO formations (id, user_id, title, description, category, duration_hours, max_participants, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [f.id, f.user_id, f.title, f.description, f.category, f.duration_hours, f.max_participants, f.type]
    );
  });
}

// Helpers SQL synchrones avec persistance automatique
function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function all(sql, params = []) {
  const results = [];
  const stmt = db.prepare(sql);
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

module.exports = { getDb, run, get, all, saveDb };
