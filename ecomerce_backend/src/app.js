const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Allows flexible media/map rendering on frontends
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, postman) or any localhost origin in dev
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || origin === process.env.CLIENT_URL) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all dev origins
    }
  },
  credentials: true,
}));

// Request Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body & Cookie Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static File Uploads Directory
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.join(__dirname, '..', uploadDir)));

// Rate Limiter
app.use('/api/', apiLimiter);

// API v1 Routing
app.use('/api/v1', routes);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
