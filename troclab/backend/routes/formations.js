/**
 * TrocLab - Routes formations
 * GET    /api/formations         - Toutes les formations actives
 * POST   /api/formations         - Créer une formation
 * GET    /api/formations/mine    - Mes formations
 * PUT    /api/formations/:id     - Modifier
 * DELETE /api/formations/:id     - Supprimer
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { get, all, run } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/formations - Catalogue public
router.get('/', (req, res) => {
  const { type, category, search } = req.query;
  let sql = `
    SELECT f.*, u.name as user_name, u.organisation, u.organisation_type, u.city, u.avatar_color
    FROM formations f
    JOIN users u ON f.user_id = u.id
    WHERE f.status = 'active'
  `;
  const params = [];

  if (type) { sql += ' AND f.type = ?'; params.push(type); }
  if (category) { sql += ' AND f.category = ?'; params.push(category); }
  if (search) {
    sql += ' AND (f.title LIKE ? OR f.description LIKE ? OR f.category LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  sql += ' ORDER BY f.created_at DESC';
  const formations = all(sql, params);
  res.json(formations);
});

// GET /api/formations/mine - Mes formations
router.get('/mine', auth, (req, res) => {
  const formations = all(
    'SELECT * FROM formations WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id]
  );
  res.json(formations);
});

// POST /api/formations - Créer
router.post('/', auth, (req, res) => {
  const { title, description, category, duration_hours, max_participants, type } = req.body;

  if (!title || !description || !category || !type) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }
  if (!['offered', 'wanted'].includes(type)) {
    return res.status(400).json({ error: 'Type invalide (offered ou wanted)' });
  }

  // Vérifier la limite freemium (2 formations max sans abonnement)
  const user = get('SELECT subscription FROM users WHERE id = ?', [req.user.id]);
  if (user.subscription === 'free') {
    const count = all('SELECT id FROM formations WHERE user_id = ?', [req.user.id]).length;
    if (count >= 2) {
      return res.status(403).json({
        error: 'Limite freemium atteinte',
        message: 'Vous avez atteint la limite de 2 formations en accès gratuit. Passez à l\'abonnement annuel (30€) pour continuer.',
        upgrade_required: true
      });
    }
  }

  const id = uuidv4();
  run(
    `INSERT INTO formations (id, user_id, title, description, category, duration_hours, max_participants, type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, req.user.id, title, description, category, duration_hours || 2, max_participants || 10, type]
  );

  const formation = get('SELECT * FROM formations WHERE id = ?', [id]);
  res.status(201).json(formation);
});

// PUT /api/formations/:id - Modifier
router.put('/:id', auth, (req, res) => {
  const existing = get('SELECT * FROM formations WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!existing) return res.status(404).json({ error: 'Formation introuvable ou non autorisée' });

  const { title, description, category, duration_hours, max_participants, status } = req.body;
  run(
    `UPDATE formations SET title = COALESCE(?, title), description = COALESCE(?, description),
     category = COALESCE(?, category), duration_hours = COALESCE(?, duration_hours),
     max_participants = COALESCE(?, max_participants), status = COALESCE(?, status)
     WHERE id = ?`,
    [title, description, category, duration_hours, max_participants, status, req.params.id]
  );

  res.json(get('SELECT * FROM formations WHERE id = ?', [req.params.id]));
});

// DELETE /api/formations/:id
router.delete('/:id', auth, (req, res) => {
  const existing = get('SELECT id FROM formations WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!existing) return res.status(404).json({ error: 'Formation introuvable ou non autorisée' });

  run("UPDATE formations SET status = 'archived' WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
