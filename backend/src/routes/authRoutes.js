import express from 'express'
import { register, login, getMe } from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// POST /api/auth/register - Register new account
router.post('/register', register)

// POST /api/auth/login - Authenticate existing user
router.post('/login', login)

// GET /api/auth/me - Get current logged in user details
router.get('/me', protect, getMe)

export default router
