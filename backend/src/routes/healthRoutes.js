import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

const dbStateMap = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isDbConnected = dbState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'ok' : 'degraded',
    message: 'Mini Social Media Platform API is healthy',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)}s`,
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStateMap[dbState] || 'unknown',
      host: mongoose.connection.host || 'unknown',
      name: mongoose.connection.name || 'mini_social_media',
    },
  });
});

export default router;
