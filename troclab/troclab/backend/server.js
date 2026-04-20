/**
 * TrocLab - Serveur principal Express
 * Stack : Node.js + Express + sql.js (SQLite en mémoire / fichier)
 *
 * Lancement : node server.js
 * Par défaut sur http://localhost:3001
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middlewares globaux ---
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Servir le frontend statique
app.use(express.static(path.join(__dirname, '../frontend/public')));

// --- Initialiser la base de données avant de démarrer ---
getDb().then(() => {
  console.log('✅ Base de données initialisée');

  // --- Routes API ---
  app.use('/api/auth',       require('./routes/auth'));
  app.use('/api/users',      require('./routes/users'));
  app.use('/api/formations', require('./routes/formations'));
  app.use('/api/exchanges',  require('./routes/exchanges'));
  app.use('/api/messages',   require('./routes/messages'));

  // Route de santé
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0', name: 'TrocLab API' });
  });

  // Toutes les autres routes → frontend SPA
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
  });

  app.listen(PORT, () => {
    console.log(`🚀 TrocLab démarre sur http://localhost:${PORT}`);
    console.log(`   Comptes de démo : alice@fablab-paris.org / demo1234`);
    console.log(`                     emma@tiers-lieu-bx.org / demo1234`);
  });
}).catch(err => {
  console.error('❌ Erreur d\'initialisation :', err);
  process.exit(1);
});
