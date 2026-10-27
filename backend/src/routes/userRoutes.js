import express from 'express'
import {
  getUserProfile,
  updateMyProfile,
  updateUserById,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from '../controllers/userController.js'
import { protect, optionalProtect } from '../middleware/authMiddleware.js'

const router = express.Router()

// PUT /api/users/me - Update authenticated user's profile
router.put('/me', protect, updateMyProfile)

// GET /api/users/:id/followers - Get user's followers list
router.get('/:id/followers', getFollowers)

// GET /api/users/:id/following - Get user's following list
router.get('/:id/following', getFollowing)

// FOLLOW / UNFOLLOW ROUTES
// PUT /api/users/:id/follow - Toggle follow/unfollow (protected)
// POST /api/users/:id/follow - Follow user (protected)
// POST /api/users/:id/unfollow - Unfollow user (protected)
// DELETE /api/users/:id/follow - Unfollow user (protected)
router
  .route('/:id/follow')
  .put(protect, followUser)
  .post(protect, followUser)
  .delete(protect, unfollowUser)

router.post('/:id/unfollow', protect, unfollowUser)

// GET /api/users/:id - Get public profile by user ID or username (optional auth for isFollowing)
router.get('/:id', optionalProtect, getUserProfile)

// PUT /api/users/:id - Update user profile by ID (enforces only self editing)
router.put('/:id', protect, updateUserById)

export default router
