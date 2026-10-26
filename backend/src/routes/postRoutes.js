import express from 'express'
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
} from '../controllers/postController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// GET /api/posts - Get all posts with pagination
// POST /api/posts - Create a new post (protected)
router.route('/').get(getPosts).post(protect, createPost)

// GET /api/posts/:id - Get single post by ID
// PUT /api/posts/:id - Edit post (protected, owner only)
// DELETE /api/posts/:id - Delete post (protected, owner only)
router
  .route('/:id')
  .get(getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost)

export default router
