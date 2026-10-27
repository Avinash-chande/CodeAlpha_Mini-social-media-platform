import request from 'supertest'
import app from '../src/app.js'
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js'

describe('Posts CRUD and Permissions API', () => {
  let user1Token
  let user1Id
  let user2Token
  let user2Id

  beforeAll(async () => {
    await connectTestDB()
  })

  beforeEach(async () => {
    await clearTestDB()

    // Register User 1
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'author_one',
        email: 'author1@example.com',
        password: 'Password123!',
      })
    user1Token = res1.body.token
    user1Id = res1.body.user._id

    // Register User 2
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'author_two',
        email: 'author2@example.com',
        password: 'Password123!',
      })
    user2Token = res2.body.token
    user2Id = res2.body.user._id
  })

  afterAll(async () => {
    await closeTestDB()
  })

  describe('POST /api/posts - Create Post', () => {
    it('should create a post successfully with content and populated author', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: 'Hello, this is my first post!',
          image: 'https://images.unsplash.com/photo-test',
        })

      expect(res.status).toBe(201)
      expect(res.body.message).toBe('Post created successfully')
      expect(res.body.post).toBeDefined()
      expect(res.body.post.content).toBe('Hello, this is my first post!')
      expect(res.body.post.image).toBe('https://images.unsplash.com/photo-test')
      expect(res.body.post.author).toBeDefined()
      expect(res.body.post.author.username).toBe('author_one')
    })

    it('should reject creating a post without authentication', async () => {
      const res = await request(app).post('/api/posts').send({
        content: 'Unauthenticated post',
      })

      expect(res.status).toBe(401)
    })

    it('should reject creating a post with empty or whitespace-only content', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: '   ',
        })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/content is required/i)
    })

    it('should reject creating a post exceeding 1000 characters', async () => {
      const longContent = 'A'.repeat(1001)
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          content: longContent,
        })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/cannot exceed 1000 characters/i)
    })
  })

  describe('GET /api/posts - Retrieve Posts', () => {
    beforeEach(async () => {
      // Create posts for testing retrieval
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ content: 'User 1 Post Alpha' })

      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'User 2 Post Beta' })
    })

    it('should return all posts with pagination metadata', async () => {
      const res = await request(app).get('/api/posts?page=1&limit=10')

      expect(res.status).toBe(200)
      expect(res.body.posts).toBeDefined()
      expect(res.body.posts.length).toBe(2)
      expect(res.body.totalPosts).toBe(2)
      expect(res.body.totalPages).toBe(1)
      expect(res.body.hasMore).toBe(false)
      expect(res.body.posts[0].likesCount).toBeDefined()
      expect(res.body.posts[0].commentsCount).toBeDefined()
    })

    it('should filter posts by author ID', async () => {
      const res = await request(app).get(`/api/posts?author=${user1Id}`)

      expect(res.status).toBe(200)
      expect(res.body.posts.length).toBe(1)
      expect(res.body.posts[0].content).toBe('User 1 Post Alpha')
    })

    it('should filter posts by author username handle', async () => {
      const res = await request(app).get('/api/posts?author=author_two')

      expect(res.status).toBe(200)
      expect(res.body.posts.length).toBe(1)
      expect(res.body.posts[0].content).toBe('User 2 Post Beta')
    })
  })

  describe('GET /api/posts/:id - Single Post', () => {
    let postId

    beforeEach(async () => {
      const created = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ content: 'Specific Post To Find' })
      postId = created.body.post._id
    })

    it('should return the post by valid ID', async () => {
      const res = await request(app).get(`/api/posts/${postId}`)

      expect(res.status).toBe(200)
      expect(res.body.post).toBeDefined()
      expect(res.body.post.content).toBe('Specific Post To Find')
    })

    it('should return 400 for invalid ObjectId format', async () => {
      const res = await request(app).get('/api/posts/not-a-valid-id')

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/invalid post id/i)
    })

    it('should return 404 for non-existent post', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011'
      const res = await request(app).get(`/api/posts/${nonExistentId}`)

      expect(res.status).toBe(404)
      expect(res.body.message).toMatch(/post not found/i)
    })
  })

  describe('PUT /api/posts/:id - Update Post & Ownership', () => {
    let postId

    beforeEach(async () => {
      const created = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ content: 'Original content before edit' })
      postId = created.body.post._id
    })

    it('should allow author to update post content', async () => {
      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ content: 'Updated content successfully!' })

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('Post updated successfully')
      expect(res.body.post.content).toBe('Updated content successfully!')
    })

    it('should forbid other users from editing post (403)', async () => {
      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'Hacker trying to edit post' })

      expect(res.status).toBe(403)
      expect(res.body.message).toMatch(/forbidden|not authorized/i)
    })

    it('should reject update with empty content', async () => {
      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ content: '   ' })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/content cannot be empty/i)
    })
  })

  describe('DELETE /api/posts/:id - Delete Post & Ownership', () => {
    let postId

    beforeEach(async () => {
      const created = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ content: 'Post to be deleted' })
      postId = created.body.post._id
    })

    it('should forbid unauthorized user from deleting post (403)', async () => {
      const res = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${user2Token}`)

      expect(res.status).toBe(403)
      expect(res.body.message).toMatch(/forbidden|not authorized/i)
    })

    it('should allow author to delete post (200)', async () => {
      const res = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${user1Token}`)

      expect(res.status).toBe(200)
      expect(res.body.message).toBe('Post deleted successfully')

      // Verify post no longer exists
      const checkRes = await request(app).get(`/api/posts/${postId}`)
      expect(checkRes.status).toBe(404)
    })
  })
})
