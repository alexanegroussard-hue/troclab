/**
 * TrocLab - Routes échanges
 * Gère la logique de réciprocité : différence max 5 entre formations reçues/données
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { get, all, run } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();
const MAX_IMBALANCE = 5; // Différence max autorisée entre voyageur et hôte

// GET /api/exchanges - Mes échanges
router.get('/', auth, (req, res) => {
  const exchanges = all(
    `SELECT e.*,
            f.title as formation_title, f.category as formation_category,
            traveler.name as traveler_name, traveler.organisation as traveler_org,
            host.name as host_name, host.organisation as host_org
     FROM exchanges e
     JOIN formations f ON e.formation_id = f.id
     JOIN users traveler ON e.traveler_id = traveler.id
     JOIN users host ON e.host_id = host.id
     WHERE e.traveler_id = ? OR e.host_id = ?
     ORDER BY e.created_at DESC`,
    [req.user.id, req.user.id]
  );
  res.json(exchanges);
});

// POST /api/exchanges - Demander un échange
router.post('/', auth, (req, res) => {
  const { formation_id, notes, date_proposed } = req.body;

  if (!formation_id) return res.status(400).json({ error: 'Formation requise' });

  const formation = get('SELECT * FROM formations WHERE id = ? AND status = ?', [formation_id, 'active']);
  if (!formation) return res.status(404).json({ error: 'Formation introuvable' });
  if (formation.type !== 'offered') return res.status(400).json({ error: 'On ne peut demander que des formations proposées' });
  if (formation.user_id === req.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas demander votre propre formation' });

  // Vérifier la règle d'équilibre
  const traveler = get('SELECT formations_as_traveler, formations_as_host, subscription FROM users WHERE id = ?', [req.user.id]);

  if (traveler.subscription !== 'free') {
    const imbalance = (traveler.formations_as_traveler + 1) - traveler.formations_as_host;
    if (imbalance > MAX_IMBALANCE) {
      return res.status(403).json({
        error: 'Déséquilibre trop important',
        message: `Vous avez reçu ${traveler.formations_as_traveler} formations et en avez donné ${traveler.formations_as_host}. Pour rééquilibrer, proposez d'abord des formations dans votre structure.`,
        imbalance_error: true
      });
    }
  }

  const id = uuidv4();
  run(
    `INSERT INTO exchanges (id, traveler_id, host_id, formation_id, notes, date_proposed)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, req.user.id, formation.user_id, formation_id, notes || '', date_proposed || null]
  );

  res.status(201).json(get(
    `SELECT e.*, f.title as formation_title, host.name as host_name
     FROM exchanges e JOIN formations f ON e.formation_id = f.id
     JOIN users host ON e.host_id = host.id WHERE e.id = ?`,
    [id]
  ));
});

// PUT /api/exchanges/:id/status - Accepter/refuser/compléter
router.put('/:id/status', auth, (req, res) => {
  const { status } = req.body;
  const exchange = get('SELECT * FROM exchanges WHERE id = ?', [req.params.id]);

  if (!exchange) return res.status(404).json({ error: 'Échange introuvable' });
  if (exchange.host_id !== req.user.id && exchange.traveler_id !== req.user.id) {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  const validStatuses = ['accepted', 'refused', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Statut invalide' });

  run('UPDATE exchanges SET status = ? WHERE id = ?', [status, req.params.id]);

  // Mettre à jour les compteurs si l'échange est complété
  if (status === 'completed') {
    run('UPDATE users SET formations_as_traveler = formations_as_traveler + 1 WHERE id = ?', [exchange.traveler_id]);
    run('UPDATE users SET formations_as_host = formations_as_host + 1 WHERE id = ?', [exchange.host_id]);
  }

  res.json({ success: true, status });
});

module.exports = router;
