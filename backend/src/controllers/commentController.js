import mongoose from 'mongoose'
import Comment from '../models/Comment.js'
import Post from '../models/Post.js'

// @desc    Get all comments for a specific post
// @route   GET /api/posts/:postId/comments
// @access  Public
export const getCommentsByPost = async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' })
    }

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    const comments = await Comment.find({ post: postId })
      .sort({ createdAt: 1 })
      .populate('author', 'username profilePicture')

    return res.status(200).json({
      comments,
      totalComments: comments.length,
    })
  } catch (error) {
    console.error('Get comments error:', error)
    return res.status(500).json({
      message: 'Server error retrieving comments',
    })
  }
}

// @desc    Add a comment to a post
// @route   POST /api/posts/:postId/comments
// @access  Private (Protected by JWT)
export const addComment = async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id
    const { content } = req.body

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({ message: 'Invalid post ID' })
    }

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        message: 'Comment content is required and cannot be empty',
      })
    }

    const cleanContent = content.trim()
    if (cleanContent.length > 500) {
      return res.status(400).json({
        message: 'Comment content cannot exceed 500 characters',
      })
    }

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      content: cleanContent,
    })

    await comment.populate('author', 'username profilePicture')

    // Update comment counter on Post
    await Post.findByIdAndUpdate(postId, {
      $inc: { commentsCount: 1 },
    })

    return res.status(201).json({
      message: 'Comment added successfully',
      comment,
    })
  } catch (error) {
    console.error('Add comment error:', error)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message)
      return res.status(400).json({ message: messages.join(', ') })
    }
    return res.status(500).json({
      message: 'Server error adding comment',
    })
  }
}

// @desc    Update a comment (Author only)
// @route   PUT /api/posts/:postId/comments/:commentId
// @route   PUT /api/comments/:commentId
// @access  Private (Protected by JWT)
export const updateComment = async (req, res) => {
  try {
    const commentId = req.params.commentId || req.params.id
    const { content } = req.body

    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({ message: 'Invalid comment ID' })
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    // Ownership check: only comment author can edit
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Forbidden: You are not authorized to edit this comment',
      })
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        message: 'Comment content cannot be empty',
      })
    }

    const cleanContent = content.trim()
    if (cleanContent.length > 500) {
      return res.status(400).json({
        message: 'Comment content cannot exceed 500 characters',
      })
    }

    comment.content = cleanContent
    await comment.save()
    await comment.populate('author', 'username profilePicture')

    return res.status(200).json({
      message: 'Comment updated successfully',
      comment,
    })
  } catch (error) {
    console.error('Update comment error:', error)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message)
      return res.status(400).json({ message: messages.join(', ') })
    }
    return res.status(500).json({
      message: 'Server error updating comment',
    })
  }
}

// @desc    Delete a comment (Comment author OR Post author)
// @route   DELETE /api/posts/:postId/comments/:commentId
// @route   DELETE /api/comments/:commentId
// @access  Private (Protected by JWT)
export const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.commentId || req.params.id

    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({ message: 'Invalid comment ID' })
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' })
    }

    // Retrieve post to check if current user is the post author
    const post = await Post.findById(comment.post)

    const isCommentAuthor =
      comment.author.toString() === req.user._id.toString()
    const isPostAuthor =
      post && post.author.toString() === req.user._id.toString()

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({
        message: 'Forbidden: You are not authorized to delete this comment',
      })
    }

    const postId = comment.post
    await comment.deleteOne()

    // Decrement post commentsCount
    if (post) {
      await Post.findByIdAndUpdate(postId, {
        $inc: { commentsCount: -1 },
      })
      // Ensure counter does not fall below zero
      await Post.updateOne(
        { _id: postId, commentsCount: { $lt: 0 } },
        { $set: { commentsCount: 0 } }
      )
    }

    return res.status(200).json({
      message: 'Comment deleted successfully',
      id: commentId,
      postId,
    })
  } catch (error) {
    console.error('Delete comment error:', error)
    return res.status(500).json({
      message: 'Server error deleting comment',
    })
  }
}
