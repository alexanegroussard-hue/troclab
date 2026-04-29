const express = require('express');
const { get, all, update, supabase } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, organisation, organisation_type, city, latitude, longitude, bio, avatar_color, subscription, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await get('users', { id: req.user.id });
    if (!user) return res.status(404).json({ error: 'Introuvable' });
    const { password: _, ...safe } = user;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await get('users', { id: req.params.id });
    if (!user) return res.status(404).json({ error: 'Introuvable' });
    const formations = await all('formations', { user_id: req.params.id, status: 'active' });
    const { password: _, ...safe } = user;
    res.json({ ...safe, formations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/me', auth, async (req, res) => {
  const { name, organisation, organisation_type, bio, city, latitude, longitude, website, email_notifications } = req.body;
    if (email_notifications !== undefined) payload.email_notifications = email_notifications;
  try {
    const payload = {};
    if (name) payload.name = name;
    if (organisation) payload.organisation = organisation;
    if (organisation_type) payload.organisation_type = organisation_type;
    if (bio !== undefined) payload.bio = bio;
    if (website !== undefined) payload.website = website;
    if (city) payload.city = city;
    if (latitude) payload.latitude = latitude;
    if (longitude) payload.longitude = longitude;
    const updated = await update('users', { id: req.user.id }, payload);
    const { password: _, ...safe } = updated;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
