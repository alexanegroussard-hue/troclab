/**
 * TrocLab - Routes utilisateurs
 * GET  /api/users         - Liste pour la carte
 * GET  /api/users/:id     - Profil public
 * PUT  /api/users/me      - Modifier son profil
 */

const express = require('express');
const { get, all, run } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/users - Liste publique pour la carte
router.get('/', (req, res) => {
  const users = all(
    `SELECT u.id, u.name, u.organisation, u.organisation_type, u.city,
            u.latitude, u.longitude, u.bio, u.avatar_color, u.subscription, u.created_at,
            (SELECT COUNT(*) FROM formations WHERE user_id = u.id AND type = 'offered' AND status = 'active') as formations_offered_count,
            (SELECT COUNT(*) FROM formations WHERE user_id = u.id AND type = 'wanted' AND status = 'active') as formations_wanted_count
     FROM users u ORDER BY u.created_at DESC`
  );
  res.json(users);
});

// GET /api/users/:id - Profil public avec formations
router.get('/:id', (req, res) => {
  const user = get(
    `SELECT id, name, organisation, organisation_type, bio, city, latitude, longitude,
            avatar_color, subscription, formations_as_traveler, formations_as_host, created_at
     FROM users WHERE id = ?`,
    [req.params.id]
  );
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

  const formations = all(
    'SELECT * FROM formations WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
    [req.params.id, 'active']
  );

  res.json({ ...user, formations });
});

// PUT /api/users/me - Mettre à jour son profil
router.put('/me', auth, (req, res) => {
  const { name, organisation, organisation_type, bio, city, latitude, longitude } = req.body;

  run(
    `UPDATE users SET name = COALESCE(?, name), organisation = COALESCE(?, organisation),
     organisation_type = COALESCE(?, organisation_type), bio = COALESCE(?, bio),
     city = COALESCE(?, city), latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude)
     WHERE id = ?`,
    [name, organisation, organisation_type, bio, city, latitude, longitude, req.user.id]
  );

  const updated = get(
    'SELECT id, email, name, organisation, organisation_type, bio, city, latitude, longitude, subscription, formations_as_traveler, formations_as_host, avatar_color, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  res.json(updated);
});

module.exports = router;
