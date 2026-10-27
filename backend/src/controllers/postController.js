import mongoose from 'mongoose'
import Post from '../models/Post.js'
import User from '../models/User.js'
import Comment from '../models/Comment.js'
import { escapeRegex } from '../utils/escapeRegex.js'

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private (Protected by JWT)
export const createPost = async (req, res) => {
  try {
    const { content, image } = req.body

    // Validate content presence and length
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        message: 'Post content is required and cannot be empty',
      })
    }

    const cleanContent = content.trim()
    if (cleanContent.length > 1000) {
      return res.status(400).json({
        message: 'Post content cannot exceed 1000 characters',
      })
    }

    let cleanImage = ''
    if (image && typeof image === 'string') {
      cleanImage = image.trim()
    }

    // Create post in MongoDB
    const post = await Post.create({
      author: req.user._id,
      content: cleanContent,
      image: cleanImage,
    })

    // Populate author with safe fields
    await post.populate('author', 'username profilePicture')

    return res.status(201).json({
      message: 'Post created successfully',
      post,
    })
  } catch (error) {
    console.error('Create post error:', error)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message)
      return res.status(400).json({ message: messages.join(', ') })
    }
    return res.status(500).json({
      message: 'Server error creating post',
    })
  }
}

// @desc    Get personalized feed (posts from followed users + own posts)
// @route   GET /api/posts/feed
// @access  Private (Protected by JWT)
export const getPersonalizedFeed = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10))

    // Fetch fresh user data to get current following array
    const currentUser = await User.findById(req.user._id)
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Include followed users AND authenticated user's own posts
    const allowedAuthors = [
      ...(currentUser.following || []),
      currentUser._id,
    ]

    const filter = { author: { $in: allowedAuthors } }

    const totalPosts = await Post.countDocuments(filter)
    const totalPages = Math.ceil(totalPosts / limit)
    const skip = (page - 1) * limit

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username profilePicture')

    const currentUserId = req.user._id.toString()
    const formattedPosts = posts.map((post) => {
      const p = post.toObject()
      p.likesCount = post.likes ? post.likes.length : 0
      p.commentsCount =
        typeof post.commentsCount === 'number' ? post.commentsCount : 0
      p.isLiked = Boolean(
        currentUserId &&
          post.likes &&
          post.likes.some((uid) => uid.toString() === currentUserId)
      )
      return p
    })

    return res.status(200).json({
      posts: formattedPosts,
      page,
      limit,
      totalPages,
      totalPosts,
      hasMore: page < totalPages,
      feedType: 'following',
    })
  } catch (error) {
    console.error('Get personalized feed error:', error)
    return res.status(500).json({
      message: 'Server error retrieving personalized feed',
    })
  }
}

// @desc    Get all posts (with pagination & optional author filter or feed=following)
// @route   GET /api/posts
// @access  Public (optional auth for isLiked)
export const getPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10))
    const { author, feed } = req.query

    // If query specifies feed=following, use personalized feed logic
    if (feed === 'following') {
      if (!req.user) {
        return res
          .status(401)
          .json({ message: 'Please log in to view following feed' })
      }
      return getPersonalizedFeed(req, res)
    }

    const filter = {}


    if (author) {
      if (mongoose.isValidObjectId(author)) {
        filter.author = author
      } else {
        // Allow lookup by username if a handle was passed
        const user = await User.findOne({
          username: { $regex: new RegExp(`^${escapeRegex(author)}$`, 'i') },
        })
        if (user) {
          filter.author = user._id
        } else {
          return res.status(200).json({
            posts: [],
            page,
            limit,
            totalPages: 0,
            totalPosts: 0,
            hasMore: false,
          })
        }
      }
    }

    const totalPosts = await Post.countDocuments(filter)
    const totalPages = Math.ceil(totalPosts / limit)
    const skip = (page - 1) * limit

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username profilePicture')

    // Attach computed like and comment metadata
    const currentUserId = req.user?._id?.toString()
    const formattedPosts = posts.map((post) => {
      const p = post.toObject()
      p.likesCount = post.likes ? post.likes.length : 0
      p.commentsCount = typeof post.commentsCount === 'number' ? post.commentsCount : 0
      p.isLiked = Boolean(
        currentUserId &&
          post.likes &&
          post.likes.some((uid) => uid.toString() === currentUserId)
      )
      return p
    })

    return res.status(200).json({
      posts: formattedPosts,
      page,
      limit,
      totalPages,
      totalPosts,
      hasMore: page < totalPages,
    })
  } catch (error) {
    console.error('Get posts error:', error)
    return res.status(500).json({
      message: 'Server error retrieving posts',
    })
  }
}

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid post ID' })
    }

    const post = await Post.findById(id).populate(
      'author',
      'username profilePicture'
    )

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    const currentUserId = req.user?._id?.toString()
    const postObj = post.toObject()
    postObj.likesCount = post.likes ? post.likes.length : 0
    postObj.commentsCount = typeof post.commentsCount === 'number' ? post.commentsCount : 0
    postObj.isLiked = Boolean(
      currentUserId &&
        post.likes &&
        post.likes.some((uid) => uid.toString() === currentUserId)
    )

    return res.status(200).json({ post: postObj })
  } catch (error) {
    console.error('Get post by ID error:', error)
    return res.status(500).json({
      message: 'Server error retrieving post',
    })
  }
}

// @desc    Update a user's own post
// @route   PUT /api/posts/:id
// @access  Private (Protected by JWT)
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params
    const { content, image } = req.body

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid post ID' })
    }

    const post = await Post.findById(id)

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Ownership check: Prevent editing other users' posts
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Forbidden: You are not authorized to edit this post',
      })
    }

    // Validate content if provided
    if (content !== undefined) {
      if (typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({
          message: 'Post content cannot be empty',
        })
      }
      const cleanContent = content.trim()
      if (cleanContent.length > 1000) {
        return res.status(400).json({
          message: 'Post content cannot exceed 1000 characters',
        })
      }
      post.content = cleanContent
    }

    // Update image if provided
    if (image !== undefined) {
      post.image = typeof image === 'string' ? image.trim() : ''
    }

    await post.save()
    await post.populate('author', 'username profilePicture')

    return res.status(200).json({
      message: 'Post updated successfully',
      post,
    })
  } catch (error) {
    console.error('Update post error:', error)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message)
      return res.status(400).json({ message: messages.join(', ') })
    }
    return res.status(500).json({
      message: 'Server error updating post',
    })
  }
}

// @desc    Delete a user's own post
// @route   DELETE /api/posts/:id
// @access  Private (Protected by JWT)
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid post ID' })
    }

    const post = await Post.findById(id)

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    // Ownership check: Prevent deleting other users' posts
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Forbidden: You are not authorized to delete this post',
      })
    }

    // Delete post
    await post.deleteOne()

    // Clean up related comments if any
    await Comment.deleteMany({ post: post._id })

    return res.status(200).json({
      message: 'Post deleted successfully',
      id: post._id,
    })
  } catch (error) {
    console.error('Delete post error:', error)
    return res.status(500).json({
      message: 'Server error deleting post',
    })
  }
}

// @desc    Like or Unlike a post (toggle)
// @route   PUT /api/posts/:id/like
// @route   POST /api/posts/:id/like
// @access  Private (Protected by JWT)
export const likePost = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid post ID' })
    }

    const post = await Post.findById(id)
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    const userId = req.user._id
    const alreadyLiked = post.likes.some(
      (uid) => uid.toString() === userId.toString()
    )

    let updatedPost
    let isLiked
    let message

    if (req.method === 'PUT' && alreadyLiked) {
      // Unlike post (toggle behavior for PUT)
      updatedPost = await Post.findByIdAndUpdate(
        id,
        { $pull: { likes: userId } },
        { new: true }
      ).populate('author', 'username profilePicture')
      isLiked = false
      message = 'Post unliked successfully'
    } else {
      // Like post ($addToSet guarantees no duplicate likes)
      updatedPost = await Post.findByIdAndUpdate(
        id,
        { $addToSet: { likes: userId } },
        { new: true }
      ).populate('author', 'username profilePicture')
      isLiked = true
      message = alreadyLiked ? 'Post already liked' : 'Post liked successfully'
    }

    const postObj = updatedPost.toObject()
    postObj.likesCount = updatedPost.likes.length
    postObj.commentsCount = typeof updatedPost.commentsCount === 'number' ? updatedPost.commentsCount : 0
    postObj.isLiked = isLiked

    return res.status(200).json({
      message,
      isLiked,
      likesCount: updatedPost.likes.length,
      likes: updatedPost.likes,
      post: postObj,
    })
  } catch (error) {
    console.error('Like post error:', error)
    return res.status(500).json({
      message: 'Server error updating post like status',
    })
  }
}

// @desc    Explicitly unlike a post
// @route   POST /api/posts/:id/unlike
// @route   DELETE /api/posts/:id/like
// @access  Private (Protected by JWT)
export const unlikePost = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid post ID' })
    }

    const post = await Post.findById(id)
    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    const userId = req.user._id
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $pull: { likes: userId } },
      { new: true }
    ).populate('author', 'username profilePicture')

    const postObj = updatedPost.toObject()
    postObj.likesCount = updatedPost.likes.length
    postObj.commentsCount = typeof updatedPost.commentsCount === 'number' ? updatedPost.commentsCount : 0
    postObj.isLiked = false

    return res.status(200).json({
      message: 'Post unliked successfully',
      isLiked: false,
      likesCount: updatedPost.likes.length,
      likes: updatedPost.likes,
      post: postObj,
    })
  } catch (error) {
    console.error('Unlike post error:', error)
    return res.status(500).json({
      message: 'Server error unliking post',
    })
  }
}

