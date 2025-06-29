// lib/tokenStore.ts
// Database-backed token store for serverless environments
import db from './db';
import crypto from 'crypto';

interface TokenData {
  token: string;
  expiresAt: Date;
}

// Create table if it doesn't exist
async function ensureTokenTable() {
  const hasTable = await db.schema.hasTable('user_tokens');
  if (!hasTable) {
    await db.schema.createTable('user_tokens', (table) => {
      table.string('session_id').primary();
      table.text('token').notNullable();
      table.timestamp('expires_at').notNullable();
      table.timestamp('created_at').defaultTo(db.fn.now());
    });
  }
}

export async function storeUserToken(sessionId: string, token: string): Promise<void> {
  await ensureTokenTable();
  
  const expiresAt = new Date(Date.now() + (30 * 60 * 1000)); // 30 minutes
  
  await db('user_tokens')
    .insert({
      session_id: sessionId,
      token,
      expires_at: expiresAt
    })
    .onConflict('session_id')
    .merge(['token', 'expires_at']);
  
  // Clean up expired tokens periodically
  await cleanupExpiredTokens();
}

export async function getUserToken(sessionId: string): Promise<string | null> {
  await ensureTokenTable();
  
  const result = await db('user_tokens')
    .select('token', 'expires_at')
    .where('session_id', sessionId)
    .first();
  
  if (!result || new Date(result.expires_at) < new Date()) {
    if (result) {
      await db('user_tokens').where('session_id', sessionId).del();
    }
    return null;
  }
  
  return result.token;
}

export async function removeUserToken(sessionId: string): Promise<void> {
  await ensureTokenTable();
  await db('user_tokens').where('session_id', sessionId).del();
}

async function cleanupExpiredTokens(): Promise<void> {
  try {
    await db('user_tokens')
      .where('expires_at', '<', new Date())
      .del();
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
  }
}

// Generate a session ID from request headers for consistency
export function generateSessionId(userAgent: string, ip: string): string {
  return crypto.createHash('sha256').update(`${userAgent}-${ip}`).digest('hex').substring(0, 32);
}
