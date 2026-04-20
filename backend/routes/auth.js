/**
 * TrocLab - Routes d'authentification
 * POST /api/auth/register - Inscription
 * POST /api/auth/login    - Connexion
 * GET  /api/auth/me       - Profil courant
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { run, get } = require('../db');
const { auth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Palette de couleurs pour les avatars
const AVATAR_COLORS = ['#2D6A4F', '#E76F51', '#457B9D', '#9B2335', '#6B705C', '#4A4E69', '#C77DFF', '#118AB2'];

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { email, password, name, organisation, organisation_type, city, latitude, longitude } = req.body;

  if (!email || !password || !name || !organisation) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Mot de passe trop court (6 caractères minimum)' });
  }

  const existing = get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) return res.status(409).json({ error: 'Email déjà utilisé' });

  const id = uuidv4();
  const hashed = bcrypt.hashSync(password, 10);
  const avatar_color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  run(
    `INSERT INTO users (id, email, password, name, organisation, organisation_type, city, latitude, longitude, avatar_color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, email, hashed, name, organisation, organisation_type || 'association',
     city || 'France', latitude || 48.8566, longitude || 2.3522, avatar_color]
  );

  const token = jwt.sign({ id, email, name }, JWT_SECRET, { expiresIn: '7d' });
  const user = get('SELECT id, email, name, organisation, organisation_type, city, subscription, formations_as_traveler, formations_as_host, avatar_color, created_at FROM users WHERE id = ?', [id]);

  res.status(201).json({ token, user });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  const user = get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

  const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// GET /api/auth/me
router.get('/me', auth, (req, res) => {
  const user = get(
    'SELECT id, email, name, organisation, organisation_type, bio, city, latitude, longitude, subscription, formations_as_traveler, formations_as_host, avatar_color, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json(user);
});

module.exports = router;
