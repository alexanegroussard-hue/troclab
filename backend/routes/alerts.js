const express = require('express');
const { supabase } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/alerts - Mes alertes configurées
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/matches - Formations qui correspondent à mes alertes
router.get('/matches', auth, async (req, res) => {
  try {
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', req.user.id);

    if (alertsError) throw alertsError;
    if (!alerts.length) return res.json([]);

    // Récupérer toutes les formations actives proposées
    const { data: formations, error: formationsError } = await supabase
      .from('formations')
      .select('*, users(name, organisation, city, avatar_color)')
      .eq('type', 'offered')
      .eq('status', 'active')
      .neq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (formationsError) throw formationsError;

    // Filtrer celles qui correspondent aux alertes
    const matches = formations.filter(f => {
      return alerts.some(alert => {
        const matchCategory = alert.category &&
          f.category.toLowerCase() === alert.category.toLowerCase();
        const matchKeyword = alert.keyword &&
          (f.title.toLowerCase().includes(alert.keyword.toLowerCase()) ||
           f.description.toLowerCase().includes(alert.keyword.toLowerCase()));
        return matchCategory || matchKeyword;
      });
    });

    // Aplatir la jointure users
    const result = matches.map(f => ({
      ...f,
      user_name: f.users?.name,
      organisation: f.users?.organisation,
      city: f.users?.city,
      avatar_color: f.users?.avatar_color,
      users: undefined
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts - Créer une alerte
router.post('/', auth, async (req, res) => {
  const { category, keyword } = req.body;
  if (!category && !keyword) {
    return res.status(400).json({ error: 'Catégorie ou mot-clé requis' });
  }

  try {
    const { data, error } = await supabase
      .from('alerts')
      .insert({ user_id: req.user.id, category, keyword })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;