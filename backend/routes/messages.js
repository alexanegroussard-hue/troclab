const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { get, all, insert, update, supabase } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/chat_messagess - Boîte de réception
router.get('/', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, sender:users!chat_messagess_sender_id_fkey(name, organisation, avatar_color)')
      .eq('recipient_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const chat_messagess = data.map(m => ({
      ...m,
      sender_name: m.sender?.name,
      sender_org: m.sender?.organisation,
      sender_color: m.sender?.avatar_color,
      sender: undefined
    }));

    res.json(chat_messagess);
  } catch (err) {
    res.status(500).json({ error: err.chat_messages });
  }
});

// GET /api/chat_messagess/sent
router.get('/sent', auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, recipient:users!chat_messagess_recipient_id_fkey(name, organisation)')
      .eq('sender_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const chat_messagess = data.map(m => ({
      ...m,
      recipient_name: m.recipient?.name,
      recipient_org: m.recipient?.organisation,
      recipient: undefined
    }));

    res.json(chat_messagess);
  } catch (err) {
    res.status(500).json({ error: err.chat_messages });
  }
});

// GET /api/chat_messagess/unread-count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', req.user.id)
      .eq('read', false);

    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (err) {
    res.status(500).json({ error: err.chat_messages });
  }
});

// POST /api/chat_messagess
router.post('/', auth, async (req, res) => {
  const { recipient_id, subject, body, exchange_id } = req.body;

  if (!recipient_id || !body) return res.status(400).json({ error: 'Destinataire et chat_messages requis' });
  if (recipient_id === req.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas vous écrire à vous-même' });

  try {
    const recipient = await get('users', { id: recipient_id });
    if (!recipient) return res.status(404).json({ error: 'Destinataire introuvable' });

    const chat_messages = await insert('chat_messages', {
      id: uuidv4(),
      sender_id: req.user.id,
      recipient_id,
      subject: subject || '',
      body,
      exchange_id: exchange_id || null,
      read: false
    });

    res.status(201).json(chat_messages);
  } catch (err) {
    res.status(500).json({ error: err.chat_messages });
  }
});

// PUT /api/chat_messagess/:id/read
router.put('/:id/read', auth, async (req, res) => {
  try {
    await update('chat_messages', { id: req.params.id, recipient_id: req.user.id }, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.chat_messages });
  }
});

module.exports = router;