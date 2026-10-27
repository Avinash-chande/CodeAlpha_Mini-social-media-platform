import express from 'express'
import {
  updateComment,
  deleteComment,
} from '../controllers/commentController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// PUT /api/comments/:id - Edit comment (protected, comment author only)
// DELETE /api/comments/:id - Delete comment (protected, comment author or post author)
router
  .route('/:id')
  .put(protect, updateComment)
  .delete(protect, deleteComment)

export default router
