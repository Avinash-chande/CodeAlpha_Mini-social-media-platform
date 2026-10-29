import request from 'supertest'
import fs from 'fs'
import path from 'path'
import app from '../src/app.js'
import User from '../src/models/User.js'
import Post from '../src/models/Post.js'
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js'

describe('Security and Data Protection Audit', () => {
  let user1Token
  let user1Id
  let user2Token
  let user2Id

  beforeAll(async () => {
    await connectTestDB()
  })

  beforeEach(async () => {
    await clearTestDB()

    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'sec_alice',
        email: 'alice.sec@example.com',
        password: 'SuperSecretPassword123!',
        bio: 'Security researcher',
      })
    user1Token = res1.body.token
    user1Id = res1.body.user._id

    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'sec_bob',
        email: 'bob.sec@example.com',
        password: 'AnotherSecretPassword456!',
        bio: 'Security auditor',
      })
    user2Token = res2.body.token
    user2Id = res2.body.user._id
  })

  afterAll(async () => {
    await closeTestDB()
  })

  describe('Password Hashing and Secrecy', () => {
    it('should hash passwords using bcrypt before storing in database', async () => {
      const storedUser = await User.findById(user1Id)
      expect(storedUser.password).toBeDefined()
      // Plaintext password must NOT be stored
      expect(storedUser.password).not.toBe('SuperSecretPassword123!')
      // Bcrypt hash starts with $2a$ or $2b$
      expect(storedUser.password).toMatch(/^\$2[ab]\$\d+\$/)
    })

    it('should never expose password hash in any authentication or profile responses', async () => {
      // Register response
      const reg = await request(app).post('/api/auth/register').send({
        username: 'sec_charlie',
        email: 'charlie.sec@example.com',
        password: 'Password999!',
      })
      expect(reg.body.user.password).toBeUndefined()

      // Login response
      const login = await request(app).post('/api/auth/login').send({
        email: 'charlie.sec@example.com',
        password: 'Password999!',
      })
      expect(login.body.user.password).toBeUndefined()

      // Get me response
      const me = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${reg.body.token}`)
      expect(me.body.user.password).toBeUndefined()

      // Public profile response
      const profile = await request(app).get(`/api/users/${user1Id}`)
      expect(profile.body.user.password).toBeUndefined()
    })
  })

  describe('Regex Injection and Sanitization', () => {
    it('should safely handle malicious regex special characters in search query', async () => {
      // Characters like [, (, *, +, ?, \\ could crash unescaped RegExp
      const maliciousQueries = ['[a-z]+', '(', '*{3}', '\\', '.*', 'foo(bar']

      for (const q of maliciousQueries) {
        const res = await request(app).get(
          `/api/users/search?q=${encodeURIComponent(q)}`
        )
        expect(res.status).toBe(200)
        expect(Array.isArray(res.body.users)).toBe(true)
      }
    })

    it('should safely handle regex special characters when querying post author', async () => {
      const res = await request(app).get(
        '/api/posts?author=' + encodeURIComponent('invalid[user(')
      )
      expect(res.status).toBe(200)
      expect(res.body.posts).toEqual([])
    })
  })

  describe('Access Control and Ownership Restrictions', () => {
    it('should prevent User 2 from updating User 1 profile (403)', async () => {
      const res = await request(app)
        .put(`/api/users/${user1Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          bio: 'Hacked bio!',
        })

      expect(res.status).toBe(403)
      expect(res.body.message).toMatch(/cannot edit another user profile/i)
    })

    it('should prevent User 2 from updating User 1 post (403)', async () => {
      const post = await Post.create({
        author: user1Id,
        content: 'Original post by Alice',
      })

      const res = await request(app)
        .put(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          content: 'Compromised content',
        })

      expect(res.status).toBe(403)
      expect(res.body.message).toMatch(/forbidden|not authorized/i)
    })

    it('should prevent User 2 from deleting User 1 post (403)', async () => {
      const post = await Post.create({
        author: user1Id,
        content: 'Protected post by Alice',
      })

      const res = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set('Authorization', `Bearer ${user2Token}`)

      expect(res.status).toBe(403)
      expect(res.body.message).toMatch(/forbidden|not authorized/i)
    })
  })

  describe('Secrets and Configuration Verification', () => {
    it('should verify .env is ignored in root and backend gitignore', () => {
      const backendGitignorePath = path.resolve(
        process.cwd(),
        '.gitignore'
      )
      const gitignoreContent = fs.readFileSync(backendGitignorePath, 'utf8')
      expect(gitignoreContent).toMatch(/\.env/)
    })

    it('should have .env.example with sample variables', () => {
      const envExamplePath = path.resolve(
        process.cwd(),
        '.env.example'
      )
      expect(fs.existsSync(envExamplePath)).toBe(true)
      const envExampleContent = fs.readFileSync(envExamplePath, 'utf8')
      expect(envExampleContent).toMatch(/PORT/)
      expect(envExampleContent).toMatch(/MONGO_URI/)
      expect(envExampleContent).toMatch(/JWT_SECRET/)
    })
  })
})
