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

export const postAPI = {
  // Get posts with pagination and optional author filtering
  getPosts: ({ page = 1, limit = 10, author } = {}) => {
    const params = new URLSearchParams()
    if (page) params.append('page', page)
    if (limit) params.append('limit', limit)
    if (author) params.append('author', author)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    return request(`/posts${queryString}`, {
      method: 'GET',
    })
  },

  // Get single post by ID
  getPostById: (id) =>
    request(`/posts/${id}`, {
      method: 'GET',
    }),

  // Create new post (content, optional image)
  createPost: (postData) =>
    request('/posts', {
      method: 'POST',
      body: postData,
    }),

  // Update existing post
  updatePost: (id, postData) =>
    request(`/posts/${id}`, {
      method: 'PUT',
      body: postData,
    }),

  // Delete post
  deletePost: (id) =>
    request(`/posts/${id}`, {
      method: 'DELETE',
    }),

  // Like or unlike a post (toggle)
  likePost: (id) =>
    request(`/posts/${id}/like`, {
      method: 'PUT',
    }),

  // Explicitly unlike a post
  unlikePost: (id) =>
    request(`/posts/${id}/unlike`, {
      method: 'POST',
    }),

  // Get comments for a post
  getComments: (postId) =>
    request(`/posts/${postId}/comments`, {
      method: 'GET',
    }),

  // Add a comment to a post
  addComment: (postId, commentData) =>
    request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: commentData,
    }),

  // Update a comment (comment author only)
  updateComment: (postId, commentId, commentData) =>
    request(`/posts/${postId}/comments/${commentId}`, {
      method: 'PUT',
      body: commentData,
    }),

  // Delete a comment (comment author or post author)
  deleteComment: (postId, commentId) =>
    request(`/posts/${postId}/comments/${commentId}`, {
      method: 'DELETE',
    }),
}

export const commentAPI = {
  getByPost: (postId) => postAPI.getComments(postId),
  add: (postId, commentData) => postAPI.addComment(postId, commentData),
  update: (postId, commentId, commentData) =>
    postAPI.updateComment(postId, commentId, commentData),
  delete: (postId, commentId) => postAPI.deleteComment(postId, commentId),
}

export default {
  auth: authAPI,
  users: userAPI,
  posts: postAPI,
  comments: commentAPI,
}

