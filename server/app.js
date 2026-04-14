const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');

const { defenseConfig } = require('./config/security');
const { conditionalLimiter } = require('./middleware/rateLimiter');
const inputSanitizer = require('./middleware/inputSanitizer');
const requestLogger = require('./middleware/logger');

const authRoutes    = require('./routes/authRoutes');
const attackRoutes  = require('./routes/attackRoutes');
const defenseRoutes = require('./routes/defenseRoutes');
const logRoutes     = require('./routes/logRoutes');

const app = express();

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.use((req, res, next) => {
  if (defenseConfig.cspEnabled) {
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc:  ["'self'"],
          styleSrc:   ["'self'", "'unsafe-inline'"],
          imgSrc:     ["'self'", 'data:'],
          connectSrc: ["'self'", clientUrl],
        },
      },
    })(req, res, next);
  } else {
    helmet({ contentSecurityPolicy: false })(req, res, next);
  }
});

app.use(cors({
  origin: clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize());
app.use(conditionalLimiter);
app.use(inputSanitizer);
app.use(requestLogger);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth',     authRoutes);
app.use('/api/attacks',  attackRoutes);
app.use('/api/defenses', defenseRoutes);
app.use('/api/logs',     logRoutes);
app.use('/api/alerts',   logRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
