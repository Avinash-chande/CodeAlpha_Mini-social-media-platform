import mongoose from 'mongoose'
import User from '../models/User.js'
import Post from '../models/Post.js'
import { escapeRegex } from '../utils/escapeRegex.js'

// Format user to ensure safe response (never sending password hash)
const formatSafeUser = async (userDoc, currentUserId) => {
  const postCount = await Post.countDocuments({ author: userDoc._id })
  const isFollowing = Boolean(
    currentUserId &&
      userDoc.followers &&
      userDoc.followers.some(
        (id) =>
          (typeof id === 'string' ? id : id?._id || id).toString() ===
          currentUserId
      )
  )

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
    isFollowing,
    postCount,
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  }
}

// @desc    Get user profile by ID (or username)
// @route   GET /api/users/:id
// @access  Public (optional auth for isFollowing)
export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params
    const cleanId = (id || '').trim()

    let user
    if ((cleanId === 'me' || cleanId === 'profile') && req.user) {
      user = await User.findById(req.user._id).select('-password')
    } else if (mongoose.isValidObjectId(cleanId)) {
      user = await User.findById(cleanId).select('-password')
    } else {
      // Allow lookup by username if not a valid ObjectId
      user = await User.findOne({
        username: { $regex: new RegExp(`^${escapeRegex(cleanId)}$`, 'i') },
      }).select('-password')
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const currentUserId = req.user?._id?.toString()
    const safeUser = await formatSafeUser(user, currentUserId)
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
          username: { $regex: new RegExp(`^${escapeRegex(cleanUsername)}$`, 'i') },
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

    const currentUserId = req.user?._id?.toString()
    const safeUser = await formatSafeUser(user, currentUserId)
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

  if (id === 'me' || id === 'profile' || (req.user && req.user._id.toString() === id)) {
    return updateMyProfile(req, res)
  }

  // Prevent editing other users' profiles
  return res.status(403).json({
    message: 'Forbidden: You cannot edit another user profile',
  })
}

// @desc    Follow or Unfollow a user (Toggle)
// @route   PUT /api/users/:id/follow
// @route   POST /api/users/:id/follow
// @access  Private (Protected by JWT)
export const followUser = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user ID' })
    }

    const currentUserId = req.user._id.toString()

    // Prevent users from following themselves
    if (currentUserId === id) {
      return res.status(400).json({ message: 'You cannot follow yourself' })
    }

    const targetUser = await User.findById(id)
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    const isAlreadyFollowing = targetUser.followers.some(
      (uid) => uid.toString() === currentUserId
    )

    let isFollowing
    let message

    // If PUT, toggle follow behavior.
    // If POST, ensure user is followed without toggling off (idempotent).
    if (req.method === 'PUT' && isAlreadyFollowing) {
      // Unfollow: remove current user from target's followers & target from current's following
      await User.findByIdAndUpdate(id, {
        $pull: { followers: req.user._id },
      })
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: id },
      })
      isFollowing = false
      message = 'User unfollowed successfully'
    } else {
      // Follow: add current user to target's followers & target to current's following ($addToSet prevents duplicates)
      await User.findByIdAndUpdate(id, {
        $addToSet: { followers: req.user._id },
      })
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { following: id },
      })
      isFollowing = true
      message = isAlreadyFollowing
        ? 'Already following user'
        : 'User followed successfully'
    }


    const updatedTarget = await User.findById(id).select('-password')

    return res.status(200).json({
      message,
      isFollowing,
      followersCount: updatedTarget.followers ? updatedTarget.followers.length : 0,
      followingCount: updatedTarget.following ? updatedTarget.following.length : 0,
      followers: updatedTarget.followers || [],
      following: updatedTarget.following || [],
    })
  } catch (error) {
    console.error('Follow user error:', error)
    return res.status(500).json({
      message: 'Server error updating follow status',
    })
  }
}

// @desc    Explicitly unfollow a user
// @route   POST /api/users/:id/unfollow
// @route   DELETE /api/users/:id/follow
// @access  Private (Protected by JWT)
export const unfollowUser = async (req, res) => {
  try {
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user ID' })
    }

    const currentUserId = req.user._id.toString()

    if (currentUserId === id) {
      return res.status(400).json({ message: 'You cannot follow or unfollow yourself' })
    }

    const targetUser = await User.findById(id)
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    await User.findByIdAndUpdate(id, {
      $pull: { followers: req.user._id },
    })
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { following: id },
    })

    const updatedTarget = await User.findById(id).select('-password')

    return res.status(200).json({
      message: 'User unfollowed successfully',
      isFollowing: false,
      followersCount: updatedTarget.followers ? updatedTarget.followers.length : 0,
      followingCount: updatedTarget.following ? updatedTarget.following.length : 0,
      followers: updatedTarget.followers || [],
      following: updatedTarget.following || [],
    })
  } catch (error) {
    console.error('Unfollow user error:', error)
    return res.status(500).json({
      message: 'Server error unfollowing user',
    })
  }
}

// @desc    Get followers list for a user
// @route   GET /api/users/:id/followers
// @access  Public
export const getFollowers = async (req, res) => {
  try {
    const { id } = req.params

    let user
    if (mongoose.isValidObjectId(id)) {
      user = await User.findById(id).populate(
        'followers',
        'username bio profilePicture'
      )
    } else {
      user = await User.findOne({
        username: { $regex: new RegExp(`^${escapeRegex(id)}$`, 'i') },
      }).populate('followers', 'username bio profilePicture')
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json({
      followers: user.followers || [],
      count: user.followers ? user.followers.length : 0,
    })
  } catch (error) {
    console.error('Get followers error:', error)
    return res.status(500).json({
      message: 'Server error retrieving followers',
    })
  }
}

// @desc    Get following list for a user
// @route   GET /api/users/:id/following
// @access  Public
export const getFollowing = async (req, res) => {
  try {
    const { id } = req.params

    let user
    if (mongoose.isValidObjectId(id)) {
      user = await User.findById(id).populate(
        'following',
        'username bio profilePicture'
      )
    } else {
      user = await User.findOne({
        username: { $regex: new RegExp(`^${escapeRegex(id)}$`, 'i') },
      }).populate('following', 'username bio profilePicture')
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json({
      following: user.following || [],
      count: user.following ? user.following.length : 0,
    })
  } catch (error) {
    console.error('Get following error:', error)
    return res.status(500).json({
      message: 'Server error retrieving following users',
    })
  }
}

// @desc    Search users by username or bio (never exposing passwords or private data)
// @route   GET /api/users/search?q=query
// @access  Public (optional auth for isFollowing)
export const searchUsers = async (req, res) => {
  try {
    const rawQuery = (req.query.q || req.query.query || '').trim()

    if (!rawQuery) {
      return res.status(200).json({ users: [], count: 0 })
    }

    // Escape regex special characters to prevent regex injection
    const escapedQuery = rawQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const searchRegex = new RegExp(escapedQuery, 'i')

    const users = await User.find({
      $or: [
        { username: { $regex: searchRegex } },
        { bio: { $regex: searchRegex } },
      ],
    })
      .select('username bio profilePicture followers following createdAt')
      .limit(20)

    const currentUserId = req.user?._id?.toString()
    const formattedUsers = users.map((u) => {
      const uObj = u.toObject()
      uObj.followersCount = u.followers ? u.followers.length : 0
      uObj.followingCount = u.following ? u.following.length : 0
      uObj.isFollowing = Boolean(
        currentUserId &&
          u.followers &&
          u.followers.some(
            (id) =>
              (typeof id === 'string' ? id : id?._id || id).toString() ===
              currentUserId
          )
      )
      return uObj
    })

    return res.status(200).json({
      users: formattedUsers,
      count: formattedUsers.length,
    })
  } catch (error) {
    console.error('Search users error:', error)
    return res.status(500).json({
      message: 'Server error searching users',
    })
  }
}

// @desc    Get suggested users (excluding self and already followed users)
// @route   GET /api/users/suggestions
// @access  Public (optional auth to exclude self and followed users)
export const getSuggestedUsers = async (req, res) => {
  try {
    const filter = {}

    if (req.user) {
      const currentUser = await User.findById(req.user._id)
      const excludeIds = [
        ...(currentUser?.following || []),
        req.user._id,
      ]
      filter._id = { $nin: excludeIds }
    }

    // Fetch up to 5 suggested users, sorted by most recent signups
    const users = await User.find(filter)
      .select('username bio profilePicture followers following createdAt')
      .sort({ createdAt: -1 })
      .limit(5)

    const currentUserId = req.user?._id?.toString()
    const formattedUsers = users.map((u) => {
      const uObj = u.toObject()
      uObj.followersCount = u.followers ? u.followers.length : 0
      uObj.followingCount = u.following ? u.following.length : 0
      uObj.isFollowing = Boolean(
        currentUserId &&
          u.followers &&
          u.followers.some(
            (id) =>
              (typeof id === 'string' ? id : id?._id || id).toString() ===
              currentUserId
          )
      )
      return uObj
    })

    return res.status(200).json({
      users: formattedUsers,
      count: formattedUsers.length,
    })
  } catch (error) {
    console.error('Get suggested users error:', error)
    return res.status(500).json({
      message: 'Server error retrieving suggested users',
    })
  }
}

