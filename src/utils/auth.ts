// X OAuth2 Authentication utilities

const CLIENT_ID = process.env.X_CLIENT_ID;
const CLIENT_SECRET = process.env.X_CLIENT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET || 'default-session-secret-change-in-production';

// Check if OAuth2 is configured
export const isOAuth2Configured = () => {
  return !!(CLIENT_ID && CLIENT_SECRET);
};

export interface XUser {
  id: string;
  username: string;
  name: string;
  profile_image_url?: string;
  verified?: boolean;
}

export interface AuthSession {
  user: XUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

/**
 * Generate OAuth2 authorization URL
 */
export function getAuthorizationUrl(state?: string): string {
  if (!CLIENT_ID) {
    throw new Error('X_CLIENT_ID not configured');
  }

  const baseUrl = 'https://x.com/i/oauth2/authorize';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: `${getBaseUrl()}/api/auth/callback`,
    scope: 'tweet.read tweet.write users.read offline.access',
    state: state || 'default',
    code_challenge_method: 'plain',
    code_challenge: 'challenge'
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<AuthSession> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('X OAuth2 not configured');
  }

  const tokenUrl = 'https://api.x.com/2/oauth2/token';

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${getBaseUrl()}/api/auth/callback`,
    code_verifier: 'challenge',
    client_id: CLIENT_ID
  });

  const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: body.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${error}`);
  }

  const tokenData = await response.json();

  // Get user info
  const userResponse = await fetch('https://api.x.com/2/users/me', {
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!userResponse.ok) {
    throw new Error('Failed to fetch user info');
  }

  const userData = await userResponse.json();

  return {
    user: {
      id: userData.data.id,
      username: userData.data.username,
      name: userData.data.name,
      profile_image_url: userData.data.profile_image_url,
      verified: userData.data.verified || false
    },
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresAt: Date.now() + (tokenData.expires_in * 1000)
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthSession> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('X OAuth2 not configured');
  }

  const tokenUrl = 'https://api.x.com/2/oauth2/token';

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: CLIENT_ID
  });

  const credentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    },
    body: body.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${response.status} ${error}`);
  }

  const tokenData = await response.json();

  // Get user info
  const userResponse = await fetch('https://api.x.com/2/users/me', {
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!userResponse.ok) {
    throw new Error('Failed to fetch user info');
  }

  const userData = await userResponse.json();

  return {
    user: {
      id: userData.data.id,
      username: userData.data.username,
      name: userData.data.name,
      profile_image_url: userData.data.profile_image_url,
      verified: userData.data.verified || false
    },
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || refreshToken,
    expiresAt: Date.now() + (tokenData.expires_in * 1000)
  };
}

/**
 * Post a tweet
 */
export async function postTweet(accessToken: string, text: string): Promise<{ id: string }> {
  const response = await fetch('https://api.x.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to post tweet: ${response.status} ${error}`);
  }

  const data = await response.json();
  return { id: data.data.id };
}

/**
 * Get base URL for the application
 */
function getBaseUrl(): string {
  // In production, this should be set via environment variable
  return process.env.BASE_URL || 'http://localhost:3005';
}

/**
 * Generate a simple session ID
 */
export function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
