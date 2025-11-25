// src/mongodb/database.utils.ts
import mongoose from 'mongoose';

/**
 * Kiểm tra trạng thái kết nối MongoDB
 * @returns true nếu đã kết nối, false nếu chưa
 */
export async function checkMongoConnection(): Promise<boolean> {
  const conn = mongoose.connection;

  switch (conn.readyState) {
    case 0: // disconnected
      console.warn('[MongoDB] Disconnected');
      return false;
    case 1: // connected
      console.log('[MongoDB] Already connected');
      return true;
    case 2: // connecting
      console.log('[MongoDB] Connecting...');
      return false;
    case 3: // disconnecting
      console.log('[MongoDB] Disconnecting...');
      return false;
    default:
      console.warn('[MongoDB] Unknown connection state');
      return false;
  }
}
