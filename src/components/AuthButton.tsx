// Authentication button component

import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthButtonProps {
  className?: string;
}

export function AuthButton({ className = '' }: AuthButtonProps) {
  const { user, loading, error, isAuthenticated, login, logout } = useAuth();

  if (loading) {
    return (
      <div className={`flex items-center px-4 py-2 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-400 text-sm px-4 py-2 ${className}`}>
        {error}
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          {user.profile_image_url && (
            <img
              src={user.profile_image_url}
              alt={`@${user.username}`}
              className="w-6 h-6 rounded-full"
            />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium" style={{ color: 'var(--x-text-primary)' }}>
              @{user.username}
            </span>
            {user.verified && (
              <span className="text-xs" style={{ color: 'var(--x-text-secondary)' }}>
                ✓ Verified
              </span>
            )}
          </div>
        </div>
        <button
          onClick={logout}
          className="text-sm px-3 py-1 rounded transition-colors hover:bg-opacity-20"
          style={{
            backgroundColor: 'var(--x-dark-gray-3)',
            color: 'var(--x-text-secondary)',
            border: '1px solid var(--x-border)'
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors ${className}`}
      style={{
        backgroundColor: 'var(--x-blue)',
        color: 'var(--x-text-primary)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--x-blue-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--x-blue)';
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
      Login with X
    </button>
  );
}
