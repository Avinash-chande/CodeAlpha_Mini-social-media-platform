import jwt from 'jsonwebtoken'

export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_dev', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

export default generateToken
