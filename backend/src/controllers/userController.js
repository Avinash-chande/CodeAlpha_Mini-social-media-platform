import mongoose from 'mongoose'
import User from '../models/User.js'
import Post from '../models/Post.js'

// Format user to ensure safe response (never sending password hash)
const formatSafeUser = async (userDoc) => {
  const postCount = await Post.countDocuments({ author: userDoc._id })
  return {
    _id: userDoc._id,
    username: userDoc.username,
    email: userDoc.email,
    bio: userDoc.bio || '',
    profilePicture: userDoc.profilePicture || '',
    followers: userDoc.followers || [],
    following: userDoc.following || [],
    followersCount: userDoc.followers ? userDoc.followers.length : 0,
    followingCount: userDoc.following ? userDoc.following.length : 0,
    postCount,
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  }
}

// @desc    Get user profile by ID (or username)
// @route   GET /api/users/:id
// @access  Public
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params

    let user
    if (mongoose.isValidObjectId(id)) {
      user = await User.findById(id).select('-password')
    } else {
      // Allow lookup by username if not a valid ObjectId
      user = await User.findOne({
        username: { $regex: new RegExp(`^${id}$`, 'i') },
      }).select('-password')
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const safeUser = await formatSafeUser(user)
    return res.status(200).json({
      user: safeUser,
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    return res.status(500).json({
      message: 'Server error retrieving user profile',
    })
  }
}

// @desc    Update current user profile
// @route   PUT /api/users/me
// @access  Private (Protected by JWT)
export const updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const { username, bio, profilePicture } = req.body

    // Update username if provided
    if (username !== undefined) {
      const cleanUsername = username.trim()
      if (cleanUsername.length < 3 || cleanUsername.length > 30) {
        return res.status(400).json({
          message: 'Username must be between 3 and 30 characters',
        })
      }

      // Check if username is taken by another user
      if (cleanUsername.toLowerCase() !== user.username.toLowerCase()) {
        const usernameExists = await User.findOne({
          username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') },
          _id: { $ne: user._id },
        })

        if (usernameExists) {
          return res.status(400).json({
            message: 'Username is already taken, please choose another',
          })
        }
      }

      user.username = cleanUsername
    }

    // Update bio if provided
    if (bio !== undefined) {
      const cleanBio = bio.trim()
      if (cleanBio.length > 300) {
        return res.status(400).json({
          message: 'Bio cannot exceed 300 characters',
        })
      }
      user.bio = cleanBio
    }

    // Update profilePicture if provided
    if (profilePicture !== undefined) {
      user.profilePicture = profilePicture.trim()
    }

    await user.save()

    const safeUser = await formatSafeUser(user)
    return res.status(200).json({
      message: 'Profile updated successfully',
      user: safeUser,
    })
  } catch (error) {
    console.error('Update profile error:', error)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message)
      return res.status(400).json({ message: messages.join(', ') })
    }
    return res.status(500).json({
      message: 'Server error updating profile',
    })
  }
}

// @desc    Update user profile by ID with strict ownership check
// @route   PUT /api/users/:id
// @access  Private (Protected by JWT)
export const updateUserById = async (req, res) => {
  const { id } = req.params

  if (id === 'me' || (req.user && req.user._id.toString() === id)) {
    return updateMyProfile(req, res)
  }

  // Prevent editing other users' profiles
  return res.status(403).json({
    message: 'Forbidden: You cannot edit another user profile',
  })
}
