const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { sendAdminNotification } = require('../resend');
const { get, all, insert, update, supabase } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/formations - Catalogue public
router.get('/', async (req, res) => {
  const { type, category, search } = req.query;
  try {
    let query = supabase
      .from('formations')
      .select('*, users(name, organisation, organisation_type, city, avatar_color)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (type) query = query.eq('type', type);
    if (category) query = query.eq('category', category);
    if (search) query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    // Aplatir la jointure
    const formations = data.map(f => ({
      ...f,
      user_name: f.users?.name,
      organisation: f.users?.organisation,
      organisation_type: f.users?.organisation_type,
      city: f.users?.city,
      avatar_color: f.users?.avatar_color,
      users: undefined
    }));

    res.json(formations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/formations/mine
router.get('/mine', auth, async (req, res) => {
  try {
    const formations = await all('formations', { user_id: req.user.id }, { order: 'created_at' });
    res.json(formations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/formations
router.post('/', auth, async (req, res) => {
  const { title, description, category, duration_hours, max_participants, type } = req.body;

  if (!title || !description || !category || !type)
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  if (!['offered', 'wanted'].includes(type))
    return res.status(400).json({ error: 'Type invalide (offered ou wanted)' });

  try {
    const user = await get('users', { id: req.user.id });
    if (user.subscription === 'free') {
      const existing = await all('formations', { user_id: req.user.id });
      if (existing.length >= 2) {
        return res.status(403).json({
          error: 'Limite freemium atteinte',
          message: 'Vous avez atteint la limite de 2 formations en accès gratuit. Passez à l\'abonnement annuel (30€) pour continuer.',
          upgrade_required: true
        });
      }
    }

    const formation = await insert('formations', {
      id: uuidv4(),
      user_id: req.user.id,
      title, description, category, type,
      duration_hours: duration_hours || 2,
      max_participants: max_participants || 10,
      status: 'active'
    });

    sendAdminNotification({ type: 'formation', title, organisation: user.organisation });
    res.status(201).json(formation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/formations/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const existing = await get('formations', { id: req.params.id, user_id: req.user.id });
    if (!existing) return res.status(404).json({ error: 'Formation introuvable ou non autorisée' });

    const { title, description, category, duration_hours, max_participants, status } = req.body;
    const payload = {};
    if (title) payload.title = title;
    if (description) payload.description = description;
    if (category) payload.category = category;
    if (duration_hours) payload.duration_hours = duration_hours;
    if (max_participants) payload.max_participants = max_participants;
    if (status) payload.status = status;

    const updated = await update('formations', { id: req.params.id }, payload);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/formations/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = await get('formations', { id: req.params.id });
    if (!existing) return res.status(404).json({ error: 'Formation introuvable ou non autorisée' });

    await update('formations', { id: req.params.id }, { status: 'archived' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
// GET /api/formations/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('formations')
      .select('*, users(name, organisation, organisation_type, city, avatar_color)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    const f = {
      ...data,
      user_name: data.users?.name,
      organisation: data.users?.organisation,
      city: data.users?.city,
      avatar_color: data.users?.avatar_color,
      users: undefined
    };
    res.json(f);
  } catch (err) {
    res.status(404).json({ error: 'Formation introuvable' });
  }
});
