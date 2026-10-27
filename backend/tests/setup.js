import mongoose from 'mongoose'
import 'dotenv/config'

const TEST_DB_URI =
  process.env.TEST_MONGO_URI ||
  'mongodb://127.0.0.1:27017/mini_social_media_test'

export const connectTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }
  await mongoose.connect(TEST_DB_URI)
}

export const clearTestDB = async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections
    for (const key in collections) {
      await collections[key].deleteMany({})
    }
  }
}

export const closeTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
  }
}
