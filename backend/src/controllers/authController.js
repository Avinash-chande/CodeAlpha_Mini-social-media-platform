import User from '../models/User.js'
import Post from '../models/Post.js'
import { generateToken } from '../utils/generateToken.js'

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

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { username, email, password, bio, profilePicture } = req.body

    // Basic presence validation
    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'Please provide username, email, and password',
      })
    }

    const cleanUsername = username.trim()
    const cleanEmail = email.toLowerCase().trim()

    // Username format check
    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      return res.status(400).json({
        message: 'Username must be between 3 and 30 characters',
      })
    }

    // Email regex check
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        message: 'Please provide a valid email address',
      })
    }

    // Password length check
    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
      })
    }

    // Check if user already exists by email or username
    const existingEmail = await User.findOne({ email: cleanEmail })
    if (existingEmail) {
      return res.status(400).json({
        message: 'An account with this email already exists',
      })
    }

    const existingUsername = await User.findOne({
      username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') },
    })
    if (existingUsername) {
      return res.status(400).json({
        message: 'Username is already taken, please choose another',
      })
    }

    // Create user in DB (password will be hashed by pre-save hook)
    const user = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password,
      bio: bio ? bio.trim() : '',
      profilePicture: profilePicture ? profilePicture.trim() : '',
    })

    const token = generateToken(user._id)
    const safeUser = await formatSafeUser(user)

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: safeUser,
    })
  } catch (error) {
    console.error('Register error:', error)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message)
      return res.status(400).json({ message: messages.join(', ') })
    }
    return res.status(500).json({
      message: 'Server error during registration',
    })
  }
}

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password',
      })
    }

    const cleanEmail = email.toLowerCase().trim()

    // Find user by email (or username fallback if users enter username)
    const user = await User.findOne({
      $or: [
        { email: cleanEmail },
        { username: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } },
      ],
    })

    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials. User does not exist.',
      })
    }

    // Match password
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid email or password',
      })
    }

    const token = generateToken(user._id)
    const safeUser = await formatSafeUser(user)

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: safeUser,
    })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({
      message: 'Server error during login',
    })
  }
}

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private (Protected by JWT)
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const safeUser = await formatSafeUser(user)
    return res.status(200).json({
      user: safeUser,
    })
  } catch (error) {
    console.error('Get me error:', error)
    return res.status(500).json({
      message: 'Server error fetching profile',
    })
  }
}
