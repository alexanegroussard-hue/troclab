const express = require('express');
const { supabase } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

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

router.get('/matches', auth, async (req, res) => {
  try {
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts').select('*').eq('user_id', req.user.id);
    if (alertsError) throw alertsError;
    if (!alerts.length) return res.json([]);

    const { data: formations, error: formationsError } = await supabase
      .from('formations')
      .select('*, users(name, organisation, city, avatar_color)')
      .eq('type', 'offered').eq('status', 'active')
      .neq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    if (formationsError) throw formationsError;

    const matches = formations.filter(f =>
      alerts.some(alert =>
        (alert.category && f.category.toLowerCase() === alert.category.toLowerCase()) ||
        (alert.keyword && (
          f.title.toLowerCase().includes(alert.keyword.toLowerCase()) ||
          f.description.toLowerCase().includes(alert.keyword.toLowerCase())
        ))
      )
    );

    res.json(matches.map(f => ({
      ...f,
      user_name: f.users?.name,
      organisation: f.users?.organisation,
      city: f.users?.city,
      avatar_color: f.users?.avatar_color,
      users: undefined
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  const { category, keyword } = req.body;
  if (!category && !keyword)
    return res.status(400).json({ error: 'Catégorie ou mot-clé requis' });
  try {
    const { data, error } = await supabase
      .from('alerts')
      .insert({ user_id: req.user.id, category, keyword })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('alerts').delete()
      .eq('id', req.params.id).eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
