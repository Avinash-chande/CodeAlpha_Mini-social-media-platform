import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mini_social_media'
    const conn = await mongoose.connect(mongoUri)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
    return conn
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`)
    process.exit(1)
  }
}
