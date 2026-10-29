import request from 'supertest'
import app from '../src/app.js'
import Post from '../src/models/Post.js'
import Comment from '../src/models/Comment.js'
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js'

describe('Likes and Comments API', () => {
  let user1Token
  let user1Id
  let user2Token
  let user2Id
  let user3Token
  let user3Id
  let postId

  beforeAll(async () => {
    await connectTestDB()
  })

  beforeEach(async () => {
    await clearTestDB()

    // Create User 1 (Post Author)
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'post_author',
        email: 'author@example.com',
        password: 'Password123!',
      })
    user1Token = res1.body.token
    user1Id = res1.body.user._id

    // Create User 2 (Commenter / Liker)
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'commenter_user',
        email: 'commenter@example.com',
        password: 'Password123!',
      })
    user2Token = res2.body.token
    user2Id = res2.body.user._id

    // Create User 3 (Bystander / Unauthorized User)
    const res3 = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'bystander_user',
        email: 'bystander@example.com',
        password: 'Password123!',
      })
    user3Token = res3.body.token
    user3Id = res3.body.user._id

    // Create a Post
    const postRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ content: 'Post open for likes and comments' })
    postId = postRes.body.post._id
  })

  afterAll(async () => {
    await closeTestDB()
  })

  describe('Likes Functionality', () => {
    it('should like a post and increment likesCount', async () => {
      const res = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${user2Token}`)

      expect(res.status).toBe(200)
      expect(res.body.isLiked).toBe(true)
      expect(res.body.likesCount).toBe(1)
    })

    it('should prevent duplicate likes from the same user', async () => {
      // First like
      await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${user2Token}`)

      // Verify DB contains only 1 like
      const postInDb = await Post.findById(postId)
      expect(postInDb.likes.length).toBe(1)

      // Second like with POST is idempotent (does not add duplicate)
      await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${user2Token}`)

      const postAfterSecond = await Post.findById(postId)
      expect(postAfterSecond.likes.length).toBe(1)
    })

    it('should unlike a post using PUT toggle', async () => {
      // Like first
      await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${user2Token}`)

      // Toggle off with PUT
      const res = await request(app)
        .put(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${user2Token}`)

      expect(res.status).toBe(200)
      expect(res.body.isLiked).toBe(false)
      expect(res.body.likesCount).toBe(0)
    })

    it('should reject like without authentication (401)', async () => {
      const res = await request(app).post(`/api/posts/${postId}/like`)
      expect(res.status).toBe(401)
    })
  })

  describe('Comments Functionality', () => {
    it('should add a comment and increment post commentsCount', async () => {
      const res = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'Insightful thought on this post!' })

      expect(res.status).toBe(201)
      expect(res.body.comment).toBeDefined()
      expect(res.body.comment.content).toBe('Insightful thought on this post!')
      expect(res.body.comment.author.username).toBe('commenter_user')

      // Check commentsCount on post
      const updatedPost = await Post.findById(postId)
      expect(updatedPost.commentsCount).toBe(1)
    })

    it('should reject comment with empty content (400)', async () => {
      const res = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: '   ' })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/cannot be empty/i)
    })

    it('should reject comment exceeding 500 characters (400)', async () => {
      const longComment = 'C'.repeat(501)
      const res = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: longComment })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/cannot exceed 500 characters/i)
    })

    it('should get all comments for a post in chronological order', async () => {
      await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'Comment 1' })

      await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${user3Token}`)
        .send({ content: 'Comment 2' })

      const res = await request(app).get(`/api/posts/${postId}/comments`)

      expect(res.status).toBe(200)
      expect(res.body.comments.length).toBe(2)
      expect(res.body.comments[0].content).toBe('Comment 1')
      expect(res.body.comments[1].content).toBe('Comment 2')
    })

    it('should allow comment author to edit their own comment (200)', async () => {
      const createRes = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'Original comment text' })
      const commentId = createRes.body.comment._id

      const editRes = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'Edited comment text' })

      expect(editRes.status).toBe(200)
      expect(editRes.body.comment.content).toBe('Edited comment text')
    })

    it('should forbid other users from editing comment (403)', async () => {
      const createRes = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'Original comment text' })
      const commentId = createRes.body.comment._id

      const editRes = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${user3Token}`)
        .send({ content: 'Malicious edit attempt' })

      expect(editRes.status).toBe(403)
      expect(editRes.body.message).toMatch(/forbidden|not authorized/i)
    })

    it('should allow comment author to delete their comment (200)', async () => {
      const createRes = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'Comment to be removed' })
      const commentId = createRes.body.comment._id

      const delRes = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${user2Token}`)

      expect(delRes.status).toBe(200)

      // Post commentsCount decremented
      const updatedPost = await Post.findById(postId)
      expect(updatedPost.commentsCount).toBe(0)
    })

    it('should allow post author to delete comments on their post (200)', async () => {
      const createRes = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'Comment to moderate' })
      const commentId = createRes.body.comment._id

      // User 1 is post author
      const delRes = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${user1Token}`)

      expect(delRes.status).toBe(200)
      expect(delRes.body.message).toMatch(/deleted successfully/i)
    })

    it('should forbid third-party user from deleting comment (403)', async () => {
      const createRes = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'Protected comment' })
      const commentId = createRes.body.comment._id

      // User 3 is neither comment author nor post author
      const delRes = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${user3Token}`)

      expect(delRes.status).toBe(403)
      expect(delRes.body.message).toMatch(/forbidden|not authorized/i)
    })
  })
})
