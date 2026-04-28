const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://unpkg.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net;");
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

getDb().then(() => {
  console.log('✅ Base de données initialisée');

  app.use('/api/auth',       require('./routes/auth'));
  app.use('/api/users',      require('./routes/users'));
  app.use('/api/formations', require('./routes/formations'));
  app.use('/api/exchanges',  require('./routes/exchanges'));
  app.use('/api/messages',   require('./routes/messages'));
  app.use('/api/alerts',     require('./routes/alerts'));  // ← ici

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0', name: 'TrocLab API' });
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
  });

  app.listen(PORT, () => {
    console.log(`🚀 TrocLab démarre sur http://localhost:${PORT}`);
  });

}).catch(err => {
  console.error('❌ Erreur initialisation:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});
