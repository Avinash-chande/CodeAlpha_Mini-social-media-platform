const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

/**
 * Universal fetch wrapper with automatic JWT token attachment and error handling
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token')

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const config = {
    ...options,
    headers,
  }

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body)
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      // If token expired or invalid, emit an auth error event
      if (response.status === 401 && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register')) {
        window.dispatchEvent(new CustomEvent('auth:expired'))
      }

      const error = new Error(data.message || `Request failed with status ${response.status}`)
      error.status = response.status
      error.data = data
      throw error
    }

    return data
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      const networkError = new Error('Cannot connect to server. Please ensure backend is running.')
      networkError.status = 0
      throw networkError
    }
    throw err
  }
}

export const authAPI = {
  // Register a new user
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: userData,
    }),

  // Login existing user
  login: (credentials) =>
    request('/auth/login', {
      method: 'POST',
      body: credentials,
    }),

  // Get current logged-in user profile
  getMe: () =>
    request('/auth/me', {
      method: 'GET',
    }),
}

export const userAPI = {
  // Get public profile by user ID or username
  getProfile: (id) =>
    request(`/users/${id}`, {
      method: 'GET',
    }),

  // Update authenticated user profile
  updateMyProfile: (profileData) =>
    request('/users/me', {
      method: 'PUT',
      body: profileData,
    }),

  // Update profile by ID (safeguarded on backend against unauthorized edits)
  updateProfileById: (id, profileData) =>
    request(`/users/${id}`, {
      method: 'PUT',
      body: profileData,
    }),
}

export default {
  auth: authAPI,
  users: userAPI,
}
