const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { get, all, insert, update, supabase } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();
const MAX_IMBALANCE = 5;

// GET /api/exchanges
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('exchanges')
      .select(`
        *,
        formations(title, category),
        traveler:users!exchanges_traveler_id_fkey(name, organisation),
        host:users!exchanges_host_id_fkey(name, organisation)
      `)
      .or(`traveler_id.eq.${req.user.id},host_id.eq.${req.user.id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const exchanges = data.map(e => ({
      ...e,
      formation_title: e.formations?.title,
      formation_category: e.formations?.category,
      traveler_name: e.traveler?.name,
      traveler_org: e.traveler?.organisation,
      host_name: e.host?.name,
      host_org: e.host?.organisation,
      formations: undefined, traveler: undefined, host: undefined
    }));

    res.json(exchanges);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/exchanges
router.post('/', auth, async (req, res) => {
  const { formation_id, notes, date_proposed } = req.body;
  if (!formation_id) return res.status(400).json({ error: 'Formation requise' });

  try {
    const formation = await get('formations', { id: formation_id, status: 'active' });
    if (!formation) return res.status(404).json({ error: 'Formation introuvable' });
    if (formation.type !== 'offered') return res.status(400).json({ error: 'On ne peut demander que des formations proposées' });
    if (formation.user_id === req.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas demander votre propre formation' });

    const traveler = await get('users', { id: req.user.id });
    if (traveler.subscription !== 'free') {
      const imbalance = (traveler.formations_as_traveler + 1) - traveler.formations_as_host;
      if (imbalance > MAX_IMBALANCE) {
        return res.status(403).json({
          error: 'Déséquilibre trop important',
          message: `Vous avez reçu ${traveler.formations_as_traveler} formations et en avez donné ${traveler.formations_as_host}.`,
          imbalance_error: true
        });
      }
    }

    const exchange = await insert('exchanges', {
      id: uuidv4(),
      traveler_id: req.user.id,
      host_id: formation.user_id,
      formation_id,
      notes: notes || '',
      date_proposed: date_proposed || null,
      status: 'pending'
    });

    res.status(201).json(exchange);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/exchanges/:id/status
router.put('/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['accepted', 'refused', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Statut invalide' });

  try {
    const exchange = await get('exchanges', { id: req.params.id });
    if (!exchange) return res.status(404).json({ error: 'Échange introuvable' });
    if (exchange.host_id !== req.user.id && exchange.traveler_id !== req.user.id)
      return res.status(403).json({ error: 'Non autorisé' });

    await update('exchanges', { id: req.params.id }, { status });

    if (status === 'completed') {
      const traveler = await get('users', { id: exchange.traveler_id });
      const host = await get('users', { id: exchange.host_id });
      await update('users', { id: exchange.traveler_id }, { formations_as_traveler: (traveler.formations_as_traveler || 0) + 1 });
      await update('users', { id: exchange.host_id }, { formations_as_host: (host.formations_as_host || 0) + 1 });
    }

    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;