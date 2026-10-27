import request from 'supertest'
import app from '../src/app.js'
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js'

describe('Follow, Personalized Feed, Search & Suggestions API', () => {
  let userAToken
  let userAId
  let userBToken
  let userBId
  let userCToken
  let userCId

  beforeAll(async () => {
    await connectTestDB()
  })

  beforeEach(async () => {
    await clearTestDB()

    // User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'user_alpha',
        email: 'alpha@example.com',
        password: 'Password123!',
        bio: 'Alpha developer building React apps',
      })
    userAToken = resA.body.token
    userAId = resA.body.user._id

    // User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'user_beta',
        email: 'beta@example.com',
        password: 'Password123!',
        bio: 'Beta designer crafting beautiful UI interfaces',
      })
    userBToken = resB.body.token
    userBId = resB.body.user._id

    // User C
    const resC = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'user_gamma',
        email: 'gamma@example.com',
        password: 'Password123!',
        bio: 'Gamma enthusiast exploring systems',
      })
    userCToken = resC.body.token
    userCId = resC.body.user._id
  })

  afterAll(async () => {
    await closeTestDB()
  })

  describe('Follow & Unfollow System', () => {
    it('should allow User A to follow User B and update counts', async () => {
      const res = await request(app)
        .post(`/api/users/${userBId}/follow`)
        .set('Authorization', `Bearer ${userAToken}`)

      expect(res.status).toBe(200)
      expect(res.body.isFollowing).toBe(true)
      expect(res.body.followersCount).toBe(1)

      // Check User A following list
      const followingRes = await request(app).get(`/api/users/${userAId}/following`)
      expect(followingRes.status).toBe(200)
      expect(followingRes.body.count).toBe(1)
      expect(followingRes.body.following[0].username).toBe('user_beta')

      // Check User B followers list
      const followersRes = await request(app).get(`/api/users/${userBId}/followers`)
      expect(followersRes.status).toBe(200)
      expect(followersRes.body.count).toBe(1)
      expect(followersRes.body.followers[0].username).toBe('user_alpha')
    })

    it('should prevent a user from following themselves (400)', async () => {
      const res = await request(app)
        .post(`/api/users/${userAId}/follow`)
        .set('Authorization', `Bearer ${userAToken}`)

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/cannot follow yourself/i)
    })

    it('should prevent duplicate follow relationships', async () => {
      // Follow first time
      await request(app)
        .post(`/api/users/${userBId}/follow`)
        .set('Authorization', `Bearer ${userAToken}`)

      // Follow second time (idempotent POST)
      const res = await request(app)
        .post(`/api/users/${userBId}/follow`)
        .set('Authorization', `Bearer ${userAToken}`)

      expect(res.status).toBe(200)
      expect(res.body.followersCount).toBe(1)
    })

    it('should allow User A to unfollow User B', async () => {
      // Follow first
      await request(app)
        .post(`/api/users/${userBId}/follow`)
        .set('Authorization', `Bearer ${userAToken}`)

      // Unfollow
      const unfollowRes = await request(app)
        .post(`/api/users/${userBId}/unfollow`)
        .set('Authorization', `Bearer ${userAToken}`)

      expect(unfollowRes.status).toBe(200)
      expect(unfollowRes.body.isFollowing).toBe(false)
      expect(unfollowRes.body.followersCount).toBe(0)
    })
  })

  describe('Personalized Feed vs Explore Feed', () => {
    beforeEach(async () => {
      // User A posts
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ content: 'User A own post' })

      // User B posts
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ content: 'User B post from followed' })

      // User C posts
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userCToken}`)
        .send({ content: 'User C post from unfollowed stranger' })

      // User A follows User B only
      await request(app)
        .post(`/api/users/${userBId}/follow`)
        .set('Authorization', `Bearer ${userAToken}`)
    })

    it('should return followed user posts and own posts in personalized feed, excluding unfollowed', async () => {
      const res = await request(app)
        .get('/api/posts/feed')
        .set('Authorization', `Bearer ${userAToken}`)

      expect(res.status).toBe(200)
      expect(res.body.posts).toBeDefined()
      expect(res.body.posts.length).toBe(2)

      const contents = res.body.posts.map((p) => p.content)
      expect(contents).toContain('User B post from followed')
      expect(contents).toContain('User A own post')
      expect(contents).not.toContain('User C post from unfollowed stranger')
    })

    it('should return all community posts in Explore feed', async () => {
      const res = await request(app).get('/api/posts')

      expect(res.status).toBe(200)
      expect(res.body.posts.length).toBe(3)
    })

    it('should support feed=following query parameter on /api/posts', async () => {
      const res = await request(app)
        .get('/api/posts?feed=following')
        .set('Authorization', `Bearer ${userAToken}`)

      expect(res.status).toBe(200)
      expect(res.body.posts.length).toBe(2)
    })
  })

  describe('User Search and Safe Data Exposure', () => {
    it('should search users by partial username', async () => {
      const res = await request(app).get('/api/users/search?q=beta')

      expect(res.status).toBe(200)
      expect(res.body.users.length).toBe(1)
      expect(res.body.users[0].username).toBe('user_beta')
    })

    it('should search users by bio keyword', async () => {
      const res = await request(app).get('/api/users/search?q=React')

      expect(res.status).toBe(200)
      expect(res.body.users.length).toBe(1)
      expect(res.body.users[0].username).toBe('user_alpha')
    })

    it('should strictly exclude password and email from search results', async () => {
      const res = await request(app).get('/api/users/search?q=user')

      expect(res.status).toBe(200)
      expect(res.body.users.length).toBeGreaterThan(0)
      for (const u of res.body.users) {
        expect(u.password).toBeUndefined()
        expect(u.email).toBeUndefined()
      }
    })
  })

  describe('Suggested Users to Follow', () => {
    beforeEach(async () => {
      // User A follows User B
      await request(app)
        .post(`/api/users/${userBId}/follow`)
        .set('Authorization', `Bearer ${userAToken}`)
    })

    it('should exclude self and already followed users from suggestions', async () => {
      const res = await request(app)
        .get('/api/users/suggestions')
        .set('Authorization', `Bearer ${userAToken}`)

      expect(res.status).toBe(200)
      expect(res.body.users).toBeDefined()

      const suggestedUsernames = res.body.users.map((u) => u.username)
      // Should not contain User A (self)
      expect(suggestedUsernames).not.toContain('user_alpha')
      // Should not contain User B (already followed)
      expect(suggestedUsernames).not.toContain('user_beta')
      // Should contain User C
      expect(suggestedUsernames).toContain('user_gamma')
    })
  })
})
