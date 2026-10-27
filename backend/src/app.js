import express from 'express'
import cors from 'cors'
import healthRoutes from './routes/healthRoutes.js'
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import postRoutes from './routes/postRoutes.js'
import commentRoutes from './routes/commentRoutes.js'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/comments', commentRoutes)


// Fallback for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

export default app
