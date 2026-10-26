import express from 'express'
import {
  getUserProfile,
  updateMyProfile,
  updateUserById,
} from '../controllers/userController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// PUT /api/users/me - Update authenticated user's profile
router.put('/me', protect, updateMyProfile)

// GET /api/users/:id - Get public profile by user ID or username
router.get('/:id', getUserProfile)

// PUT /api/users/:id - Update user profile by ID (enforces only self editing)
router.put('/:id', protect, updateUserById)

export default router
