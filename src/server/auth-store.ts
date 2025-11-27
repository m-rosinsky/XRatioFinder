// Simple in-memory session store for OAuth2 authentication
// In production, this should be replaced with a proper database

import type { AuthSession } from '../utils/auth';

class AuthStore {
  private sessions = new Map<string, AuthSession>();

  // Store session by session ID
  setSession(sessionId: string, session: AuthSession): void {
    this.sessions.set(sessionId, session);
  }

  // Get session by session ID
  getSession(sessionId: string): AuthSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Check if token is expired
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  // Remove session
  removeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  // Get all active sessions (for debugging)
  getAllSessions(): AuthSession[] {
    return Array.from(this.sessions.values()).filter(session =>
      Date.now() <= session.expiresAt
    );
  }

  // Clean up expired sessions (should be called periodically)
  cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
      }
    }
    console.log(`🧹 Cleaned up expired sessions, ${this.sessions.size} active`);
  }
}

export const authStore = new AuthStore();

// Clean up expired sessions every 5 minutes
setInterval(() => {
  authStore.cleanupExpiredSessions();
}, 5 * 60 * 1000);
