import mongoose, { Connection } from 'mongoose';
import env from './environment';

let connection: Connection | null = null;

export async function connectDatabase(): Promise<Connection> {
  if (connection) {
    console.log('[DB] Using existing database connection');
    return connection;
  }

  try {
    console.log('[DB] Connecting to MongoDB...');

    const mongooseInstance = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    connection = mongooseInstance.connection;

    console.log('[DB] Connected to MongoDB successfully');

    // Handle connection events
    connection.on('disconnected', () => {
      console.log('[DB] Disconnected from MongoDB');
    });

    connection.on('error', (error) => {
      console.error('[DB] MongoDB connection error:', error);
    });

    return connection;
  } catch (error) {
    console.error('[DB] Failed to connect to MongoDB:', error);
    throw error;
  }
}

export function getConnection(): Connection {
  if (!connection) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return connection;
}

export async function disconnectDatabase(): Promise<void> {
  if (connection) {
    await mongoose.disconnect();
    connection = null;
    console.log('[DB] Disconnected from MongoDB');
  }
}

export default {
  connectDatabase,
  getConnection,
  disconnectDatabase,
};
