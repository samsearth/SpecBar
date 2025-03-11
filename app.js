// app.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { AzureOpenAI } = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');
const officegen = require('officegen');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
 
const app = express();
 
// Middleware configuration
app.use(cors({
  origin: ['http://localhost:3000', 'https://your-production-domain.com'],
  methods: ['POST', 'GET'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
 
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
 
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));
app.use('/generate-spec', apiLimiter);
 
// Define your routes (e.g., /health, /analyze-competitors, /generate-spec, /download-spec)
// ... (copy over your routes from your current server.js)
 
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});
 
module.exports = app;