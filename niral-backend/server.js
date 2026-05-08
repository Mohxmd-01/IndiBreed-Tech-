require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

// Route imports
const authRoutes     = require('./routes/auth');
const cattleRoutes   = require('./routes/cattle');
const milkRoutes     = require('./routes/milk');
const alertRoutes    = require('./routes/alerts');
const deviceRoutes   = require('./routes/devices');
const advisoryRoutes = require('./routes/advisory');
const financeRoutes  = require('./routes/finance');
const vetRoutes      = require('./routes/vet');      // Phase 2

const app = express();

// ── Connect to MongoDB ──────────────────────────────────────────────────────
connectDB();

// ── Security & Parsing Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting ───────────────────────────────────────────────────────────
app.use('/api/', rateLimiter);

// ── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), service: 'NiralFarm API v2' });
});


// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/cattle',   cattleRoutes);
app.use('/api/milk',     milkRoutes);
app.use('/api/alerts',   alertRoutes);
app.use('/api/devices',  deviceRoutes);
app.use('/api/advisory', advisoryRoutes);
app.use('/api/finance',  financeRoutes);
app.use('/api/vet',      vetRoutes);      // Phase 2


// ── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// ── Global Error Handler (must be last) ────────────────────────────────────
app.use(errorHandler);

// ── Start Server ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  logger.info(`🚀 NiralFarm API running on http://localhost:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🌿 MongoDB: ${process.env.MONGO_URI}`);

  // Start IoT simulator after server is up
  if (process.env.NODE_ENV !== 'test') {
    const { startIoTSimulator } = require('./services/iotSimulator');
    startIoTSimulator();
  }
});

// ── Graceful Shutdown ───────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Closing server...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
