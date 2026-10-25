import express from 'express'
import mongoose from 'mongoose'

const router = express.Router()

// GET /api/health
router.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'

  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
    },
  })
})

export default router
