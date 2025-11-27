// Authentication hook for X OAuth2

import { useState, useEffect, useCallback } from 'react';
import type { XUser } from '../utils/auth';

export interface AuthState {
  user: XUser | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (data.authenticated && data.user) {
        setAuthState({
          user: data.user,
          loading: false,
          error: null
        });
      } else {
        setAuthState({
          user: null,
          loading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState({
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication check failed'
      });
    }
  }, []);

  // Login with X
  const login = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/login');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get auth URL');
      }

      // Redirect to X OAuth2
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Login failed:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed'
      }));
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      setAuthState({
        user: null,
        loading: false,
        error: null
      });

      // Reload page to clear any cached state
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      }));
    }
  }, []);

  // Share to X
  const shareToX = useCallback(async (text: string) => {
    if (!authState.user) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch('/api/auth/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to share');
      }

      return data;
    } catch (error) {
      console.error('Share failed:', error);
      throw error;
    }
  }, [authState.user]);

  // Check auth on mount and when URL changes (for OAuth callback)
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Check for auth callback in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');

    if (authParam === 'success') {
      // Clear the URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Check auth status after successful login
      checkAuth();
    } else if (authParam === 'error' || authParam === 'callback_error') {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'Authentication failed. Please try again.'
      }));

      // Clear the URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    } else if (authParam === 'disabled') {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: 'OAuth2 authentication is not configured on this server.'
      }));

      // Clear the URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [checkAuth]);

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: !!authState.user,
    login,
    logout,
    shareToX,
    checkAuth
  };
}
