// Share to X button component

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface ShareButtonProps {
  ratio: number;
  parentAuthor: string;
  replyAuthor: string;
  parentTweetId: string;
  replyTweetId: string;
  className?: string;
}

export function ShareButton({
  ratio,
  parentAuthor,
  replyAuthor,
  parentTweetId,
  replyTweetId,
  className = ''
}: ShareButtonProps) {
  const { isAuthenticated, shareToX } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const generateShareText = () => {
    const ratioText = ratio >= 100 ? '💀 LETHAL' : ratio >= 10 ? '🔥 BRUTAL' : '';
    return `${ratioText} RATIO! @${replyAuthor} destroyed @${parentAuthor} with a ${ratio.toFixed(1)}x ratio!

🔗 Parent: https://x.com/${parentAuthor}/status/${parentTweetId}
💥 Ratio: https://x.com/${replyAuthor}/status/${replyTweetId}

#RatioFinder #XRatio`;
  };

  const handleShareClick = () => {
    setShowPreview(true);
  };

  const handleConfirmShare = async () => {
    if (!isAuthenticated) return;

    setShowPreview(false);
    setSharing(true);
    setError(null);

    try {
      const text = generateShareText();
      const result = await shareToX(text);

      setShared(true);

      // Open the tweet in a new tab
      window.open(result.url, '_blank');

      // Reset after 3 seconds
      setTimeout(() => {
        setShared(false);
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share');
    } finally {
      setSharing(false);
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
  };

  if (!isAuthenticated) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium opacity-50 cursor-not-allowed ${className}`}
        style={{
          backgroundColor: 'var(--x-dark-gray-4)',
          color: 'var(--x-text-muted)'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
        Login to Share
      </button>
    );
  }

  if (shared) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${className}`}
        style={{
          backgroundColor: 'var(--x-green)',
          color: 'white'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        Shared!
      </button>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <button
          onClick={handleShareClick}
          disabled={sharing}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${className} ${
            sharing ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90'
          }`}
          style={{
            backgroundColor: 'var(--x-blue)',
            color: 'var(--x-text-primary)'
          }}
          onMouseEnter={(e) => {
            if (!sharing) {
              e.currentTarget.style.backgroundColor = 'var(--x-blue-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!sharing) {
              e.currentTarget.style.backgroundColor = 'var(--x-blue)';
            }
          }}
        >
          {sharing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
              Sharing...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share Ratio
            </>
          )}
        </button>
        {error && (
          <div className="text-xs text-red-400 px-1">
            {error}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={handleCancel}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-md p-6 rounded-2xl shadow-2xl"
            style={{
              backgroundColor: 'var(--x-dark-gray-2)',
              border: '1px solid var(--x-border)'
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--x-blue)' }}>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--x-text-primary)' }}>
                Share Ratio
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-sm mb-3" style={{ color: 'var(--x-text-secondary)' }}>
                This will be posted to your X timeline:
              </p>

              <div
                className="p-4 rounded-xl border text-sm"
                style={{
                  backgroundColor: 'var(--x-dark-gray-1)',
                  borderColor: 'var(--x-border)',
                  color: 'var(--x-text-primary)',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}
              >
                <pre className="whitespace-pre-wrap font-sans">{generateShareText()}</pre>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{
                  backgroundColor: 'var(--x-dark-gray-4)',
                  color: 'var(--x-text-secondary)',
                  border: '1px solid var(--x-border)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmShare}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
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
                Post to X
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
