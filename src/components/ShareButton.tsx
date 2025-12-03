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
      window.open(result.url, '_blank');

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
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium opacity-50 cursor-not-allowed bg-white/5 border border-white/10 text-white/50 ${className}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
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
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-emerald-500 text-white ${className}`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
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
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            sharing ? 'opacity-75 cursor-not-allowed' : 'hover:bg-white/90'
          } bg-white text-black ${className}`}
        >
          {sharing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
              Sharing...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share
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
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#0A0A0B] border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <h3 className="text-lg font-medium text-white">
                Share Ratio
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-sm mb-3 text-white/60">
                This will be posted to your X timeline:
              </p>

              <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-sm text-white/90">
                <pre className="whitespace-pre-wrap font-sans leading-relaxed">{generateShareText()}</pre>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmShare}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors bg-white text-black hover:bg-white/90"
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
