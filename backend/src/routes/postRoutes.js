import express from 'express'
import {
  createPost,
  getPosts,
  getPersonalizedFeed,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
} from '../controllers/postController.js'
import {
  getCommentsByPost,
  addComment,
  updateComment,
  deleteComment,
} from '../controllers/commentController.js'
import { protect, optionalProtect } from '../middleware/authMiddleware.js'

const router = express.Router()

// GET /api/posts - Get all posts with pagination (optional auth for isLiked)
// POST /api/posts - Create a new post (protected)
router.route('/').get(optionalProtect, getPosts).post(protect, createPost)

// GET /api/posts/feed - Get personalized feed for following users (protected)
router.get('/feed', protect, getPersonalizedFeed)


// GET /api/posts/:id - Get single post by ID (optional auth for isLiked)
// PUT /api/posts/:id - Edit post (protected, owner only)
// DELETE /api/posts/:id - Delete post (protected, owner only)
router
  .route('/:id')
  .get(optionalProtect, getPostById)
  .put(protect, updatePost)
  .delete(protect, deletePost)

// LIKES ROUTES
// PUT /api/posts/:id/like - Toggle like/unlike (protected)
// POST /api/posts/:id/like - Like post (protected)
// DELETE /api/posts/:id/like - Unlike post (protected)
// POST /api/posts/:id/unlike - Explicit unlike post (protected)
router
  .route('/:id/like')
  .put(protect, likePost)
  .post(protect, likePost)
  .delete(protect, unlikePost)

router.route('/:id/unlike').post(protect, unlikePost)

// COMMENTS ROUTES
// GET /api/posts/:postId/comments - Get all comments for a post
// POST /api/posts/:postId/comments - Add a comment to a post (protected)
router
  .route('/:postId/comments')
  .get(getCommentsByPost)
  .post(protect, addComment)

// PUT /api/posts/:postId/comments/:commentId - Edit comment (protected, comment author only)
// DELETE /api/posts/:postId/comments/:commentId - Delete comment (protected, comment or post author)
router
  .route('/:postId/comments/:commentId')
  .put(protect, updateComment)
  .delete(protect, deleteComment)

export default router

