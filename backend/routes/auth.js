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
const { get, insert } = require('../db');
const { auth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const AVATAR_COLORS = ['#2D6A4F', '#E76F51', '#457B9D', '#9B2335', '#6B705C', '#4A4E69', '#C77DFF', '#118AB2'];

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name, organisation, organisation_type, city, latitude, longitude } = req.body;

  if (!email || !password || !name || !organisation) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Mot de passe trop court (6 caractères minimum)' });
  }

  try {
    const existing = await get('users', { email });
    if (existing) return res.status(409).json({ error: 'Email déjà utilisé' });

    const id = uuidv4();
    const hashed = bcrypt.hashSync(password, 10);
    const avatar_color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const user = await insert('users', {
      id, email, password: hashed, name, organisation,
      organisation_type: organisation_type || 'association',
      city: city || 'France',
      latitude: latitude || 48.8566,
      longitude: longitude || 2.3522,
      avatar_color
    });

    const token = jwt.sign({ id, email, name, is_admin: user.is_admin }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.status(201).json({ token, user: safeUser });

  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' });

  try {
    const user = await get('users', { email });
    if (!user) return res.status(401).json({ error: 'Identifiants incorrects' });

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Identifiants incorrects' });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await get('users', { id: req.user.id });
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;