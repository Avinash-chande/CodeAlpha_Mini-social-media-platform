import express from 'express'
import cors from 'cors'
import healthRoutes from './routes/healthRoutes.js'

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api', healthRoutes)

// Fallback for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

export default app
