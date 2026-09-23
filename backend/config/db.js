import mongoose from 'mongoose';

export async function connectDB(uri) {
  const mongoUri = uri || process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('MongoDB URI is not defined. Starting without a database connection.');
    return false;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('MongoDB connected successfully.');
    return true;
  } catch (error) {
    console.warn('MongoDB connection failed. Starting API without a database connection.');
    console.warn(error.message);
    return false;
  }
}
