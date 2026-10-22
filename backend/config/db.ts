import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

const initialEnvUri = process.env.MONGODB_URI;

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
dotenv.config();

export const DB_NAME = 'freshleaf';

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  const uri = initialEnvUri || process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    console.warn(
      `[MongoDB] MONGODB_URI is not set. Ready to connect to MongoDB Atlas database '${DB_NAME}' once configured in backend/.env.`
    );
    return false;
  }

  try {
    console.log(`[MongoDB] Connecting to MongoDB Atlas database: ${DB_NAME}...`);
    
    // Connect explicitly to the user's freshleaf database
    await mongoose.connect(uri, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 8000,
    });

    isConnected = true;
    console.log(`[MongoDB] Connected successfully to MongoDB Atlas database '${DB_NAME}'. Existing data preserved.`);
    return true;
  } catch (error: any) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    isConnected = false;
    return false;
  }
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[MongoDB] Disconnected from MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Connection error event:', err.message);
});
