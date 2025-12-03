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
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/50 border-t-transparent mr-2"></div>
        <span className="text-sm text-white/60 font-mono">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-red-400 text-sm px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full ${className}`}>
        {error}
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          {user.profile_image_url ? (
            <img
              src={user.profile_image_url}
              alt={`@${user.username}`}
              className="w-8 h-8 rounded-full border border-white/10"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white border border-white/10">
              {user.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex flex-col hidden sm:flex">
            <span className="text-sm font-medium text-white leading-none mb-1">
              @{user.username}
            </span>
            {user.verified && (
              <span className="text-[10px] text-[#1d9bf0] font-mono uppercase tracking-wider flex items-center gap-1">
                <span>Verified</span>
                <svg viewBox="0 0 24 24" aria-label="Verified account" className="w-3 h-3 fill-current"><g><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .495.083.965.238 1.4-1.272.65-2.147 2.02-2.147 3.6 0 1.435.716 2.69 1.77 3.46-.252.546-.42 1.137-.42 1.79 0 2.21 1.71 4 3.818 4 .47 0 .92-.086 1.336-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.866.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.65-.17-1.242-.42-1.79 1.054-.77 1.77-2.024 1.77-3.46zM12 4.5c1.215 0 2.266.723 2.714 1.79.305.726.915 1.265 1.642 1.467.297.082.613.125.938.125 1.38 0 2.5 1.12 2.5 2.5 0 .174-.03.342-.075.503-.15.542.1.77.18.96.85.66 1.403 1.67 1.403 2.805 0 1.932-1.568 3.5-3.5 3.5-.126 0-.25-.01-.372-.028-.552-.085-1.112.14-1.437.59-.42.58-1.105.938-1.84.938-1.214 0-2.266-.723-2.713-1.79-.304-.727-.915-1.266-1.642-1.468-.297-.083-.613-.125-.938-.125-1.38 0-2.5-1.12-2.5-2.5 0-.174.03-.342.075-.503.15-.542-.1-.77-.18-.96-.85-.66-1.402-1.67-1.402-2.805 0-1.932 1.568-3.5 3.5-3.5.126 0 .25.01.372.028.552.085 1.112-.14 1.437-.59.42-.58 1.104-.938 1.84-.938zm-2.03 10.355l-3.603-3.716 1.33-1.29 2.328 2.4 4.99-5.025 1.28 1.34-6.326 6.29z"></path></g></svg>
              </span>
            )}
          </div>
        </div>
        <button
          onClick={logout}
          className="text-xs font-mono uppercase tracking-wider text-white/50 hover:text-white transition-colors px-3 py-1.5 rounded-full border border-white/10 hover:bg-white/5 hover:border-white/30"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      className={`group relative inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-2.5 font-mono text-sm tracking-widest text-white uppercase transition-all hover:bg-white/10 hover:border-white/50 ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
      <span>Sign In</span>
    </button>
  );
}
