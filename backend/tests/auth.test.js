import request from 'supertest'
import app from '../src/app.js'
import User from '../src/models/User.js'
import { connectTestDB, clearTestDB, closeTestDB } from './setup.js'

describe('Authentication & Protected Routes API', () => {
  beforeAll(async () => {
    await connectTestDB()
  })

  beforeEach(async () => {
    await clearTestDB()
  })

  afterAll(async () => {
    await closeTestDB()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'alice_test',
          email: 'alice@example.com',
          password: 'Password123!',
          bio: 'Frontend enthusiast',
        })

      expect(res.status).toBe(201)
      expect(res.body.message).toBe('User registered successfully')
      expect(res.body.token).toBeDefined()
      expect(res.body.user).toBeDefined()
      expect(res.body.user.username).toBe('alice_test')
      expect(res.body.user.email).toBe('alice@example.com')
      expect(res.body.user.password).toBeUndefined()
    })

    it('should reject registration if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'missing_fields',
        })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/provide username, email, and password/i)
    })

    it('should reject registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'bademail',
          email: 'not-an-email',
          password: 'Password123!',
        })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/valid email/i)
    })

    it('should reject registration if password is less than 6 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'shortpass',
          email: 'short@example.com',
          password: '123',
        })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/at least 6 characters/i)
    })

    it('should reject registration if email is already taken', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user_one',
          email: 'duplicate@example.com',
          password: 'Password123!',
        })

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user_two',
          email: 'duplicate@example.com',
          password: 'Password123!',
        })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/already exists/i)
    })

    it('should reject registration if username is already taken (case-insensitive)', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'BobBuilder',
          email: 'bob1@example.com',
          password: 'Password123!',
        })

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'bobbuilder',
          email: 'bob2@example.com',
          password: 'Password123!',
        })

      expect(res.status).toBe(400)
      expect(res.body.message).toMatch(/already taken/i)
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'charlie',
          email: 'charlie@example.com',
          password: 'Password123!',
        })
    })

    it('should log in successfully with valid email and password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'charlie@example.com',
          password: 'Password123!',
        })

      expect(res.status).toBe(200)
      expect(res.body.token).toBeDefined()
      expect(res.body.user.username).toBe('charlie')
      expect(res.body.user.password).toBeUndefined()
    })

    it('should log in successfully using username as handle', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'charlie',
          password: 'Password123!',
        })

      expect(res.status).toBe(200)
      expect(res.body.token).toBeDefined()
      expect(res.body.user.username).toBe('charlie')
    })

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'charlie@example.com',
          password: 'WrongPassword!',
        })

      expect(res.status).toBe(401)
      expect(res.body.message).toMatch(/invalid.*password/i)
    })

    it('should reject login with non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody@example.com',
          password: 'Password123!',
        })

      expect(res.status).toBe(401)
      expect(res.body.message).toMatch(/invalid credentials/i)
    })
  })

  describe('GET /api/auth/me and Protected Routes', () => {
    let token

    beforeEach(async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'protected_user',
          email: 'protect@example.com',
          password: 'Password123!',
        })
      token = reg.body.token
    })

    it('should return current authenticated user data when bearer token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.user).toBeDefined()
      expect(res.body.user.username).toBe('protected_user')
      expect(res.body.user.password).toBeUndefined()
    })

    it('should reject access to protected route if no token is provided', async () => {
      const res = await request(app).get('/api/auth/me')

      expect(res.status).toBe(401)
      expect(res.body.message).toMatch(/no token provided/i)
    })

    it('should reject access if token is invalid or corrupted', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.corrupted.token')

      expect(res.status).toBe(401)
      expect(res.body.message).toMatch(/invalid token|authorization denied/i)
    })
  })
})
