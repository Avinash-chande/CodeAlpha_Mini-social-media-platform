import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  // Check current session on mount or token change
  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (!storedToken) {
        if (isMounted) {
          setUser(null)
          setIsLoading(false)
        }
        return
      }

      try {
        const data = await authAPI.getMe()
        if (isMounted) {
          setUser(data.user)
        }
      } catch (err) {
        console.warn('Session verification failed:', err.message)
        if (isMounted) {
          logout()
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    checkAuth()

    // Listen for auth expiration events dispatched by API service
    const handleAuthExpired = () => {
      logout()
    }

    window.addEventListener('auth:expired', handleAuthExpired)
    return () => {
      isMounted = false
      window.removeEventListener('auth:expired', handleAuthExpired)
    }
  }, [logout])

  // Login action
  const login = async (credentials) => {
    const data = await authAPI.login(credentials)
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data
  }

  // Register action
  const register = async (userData) => {
    const data = await authAPI.register(userData)
    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
    return data
  }

  // Update profile in state
  const updateUser = (updatedUser) => {
    setUser((prev) => ({
      ...prev,
      ...updatedUser,
    }))
  }

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
