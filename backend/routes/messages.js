/**
 * TrocLab - Routes messagerie interne
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { get, all, run } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/messages - Boîte de réception
router.get('/', auth, (req, res) => {
  const messages = all(
    `SELECT m.*, s.name as sender_name, s.organisation as sender_org, s.avatar_color as sender_color
     FROM messages m
     JOIN users s ON m.sender_id = s.id
     WHERE m.recipient_id = ?
     ORDER BY m.created_at DESC`,
    [req.user.id]
  );
  res.json(messages);
});

// GET /api/messages/sent - Messages envoyés
router.get('/sent', auth, (req, res) => {
  const messages = all(
    `SELECT m.*, r.name as recipient_name, r.organisation as recipient_org
     FROM messages m
     JOIN users r ON m.recipient_id = r.id
     WHERE m.sender_id = ?
     ORDER BY m.created_at DESC`,
    [req.user.id]
  );
  res.json(messages);
});

// GET /api/messages/unread-count
router.get('/unread-count', auth, (req, res) => {
  const result = get('SELECT COUNT(*) as count FROM messages WHERE recipient_id = ? AND read = 0', [req.user.id]);
  res.json({ count: result ? result.count : 0 });
});

// POST /api/messages - Envoyer un message
router.post('/', auth, (req, res) => {
  const { recipient_id, subject, body, exchange_id } = req.body;

  if (!recipient_id || !body) return res.status(400).json({ error: 'Destinataire et message requis' });
  if (recipient_id === req.user.id) return res.status(400).json({ error: 'Vous ne pouvez pas vous écrire à vous-même' });

  const recipient = get('SELECT id FROM users WHERE id = ?', [recipient_id]);
  if (!recipient) return res.status(404).json({ error: 'Destinataire introuvable' });

  const id = uuidv4();
  run(
    'INSERT INTO messages (id, sender_id, recipient_id, subject, body, exchange_id) VALUES (?, ?, ?, ?, ?, ?)',
    [id, req.user.id, recipient_id, subject || '', body, exchange_id || null]
  );

  res.status(201).json(get('SELECT * FROM messages WHERE id = ?', [id]));
});

// PUT /api/messages/:id/read - Marquer comme lu
router.put('/:id/read', auth, (req, res) => {
  run('UPDATE messages SET read = 1 WHERE id = ? AND recipient_id = ?', [req.params.id, req.user.id]);
  res.json({ success: true });
});

module.exports = router;
