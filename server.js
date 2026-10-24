// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
// Import Routers
const authRoutes = require('./routes/auth.routes');
const cricketRouter = require('./routes/cricket.routes');
const top10Router = require('./routes/top10.routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:4200',           // Angular frontend local
    'https://youtube-frontend.vercel.app' // Vercel production frontend
  ]
}));
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Youtube_Service', 
    uptime: process.uptime() 
  });
});

// Register Modular Routes
app.use('/api/cricket', cricketRouter);
app.use('/api/top10', top10Router);
app.use('/api/auth', authRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Youtube_Service running on http://localhost:${PORT}`);
});