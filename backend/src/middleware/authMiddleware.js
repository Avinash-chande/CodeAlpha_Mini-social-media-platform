import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const protect = async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1]

      if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' })
      }

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_secret_key_dev'
      )

      // Fetch user without password
      const user = await User.findById(decoded.id).select('-password')

      if (!user) {
        return res
          .status(401)
          .json({ message: 'User belonging to this token no longer exists' })
      }

      req.user = user
      return next()
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: 'Token has expired, please log in again',
          code: 'TOKEN_EXPIRED',
        })
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          message: 'Invalid token, authorization denied',
          code: 'INVALID_TOKEN',
        })
      }

      return res.status(401).json({
        message: 'Authentication failed, authorization denied',
      })
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: 'Not authorized, no token provided' })
  }
}

export default protect
