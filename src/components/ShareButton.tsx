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
  const { isAuthenticated } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [shareText, setShareText] = useState('');

  const generateShareText = () => {
    const ratioText = ratio >= 100 ? '💀 LETHAL' : ratio >= 10 ? '🔥 BRUTAL' : '⚡';
    return `${ratioText} RATIO! @${replyAuthor} destroyed @${parentAuthor} with a ${ratio.toFixed(1)}x ratio! 🔥`;
  };

  const handleShareClick = () => {
    setShareText(generateShareText());
    setShowPreview(true);
  };

  const handleConfirmShare = () => {
    setShowPreview(false);

    // Create Twitter intent URL with pre-filled text and quote tweet URL
    const tweetUrl = `https://x.com/${replyAuthor}/status/${replyTweetId}`;
    const fullText = `${shareText} ${tweetUrl}`;
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`;

    // Open Twitter composer in new tab
    window.open(intentUrl, '_blank');

    // Show success state briefly
    setShared(true);
    setTimeout(() => {
      setShared(false);
    }, 3000);
  };

  const handleCancel = () => {
    setShowPreview(false);
  };

  if (!isAuthenticated) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono uppercase tracking-wide opacity-50 cursor-not-allowed border border-white/10 text-white/40 ${className}`}
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
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono uppercase tracking-wide bg-emerald-500 text-white border border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] ${className}`}
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
          className={`group relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono uppercase tracking-wide bg-white text-black transition-all hover:bg-white/90 disabled:opacity-75 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] ${className}`}
        >
          {sharing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-black/30 border-t-black"></div>
              Sharing...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="transition-transform group-hover:scale-110">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share Ratio
            </>
          )}
        </button>
        {error && (
          <div className="text-[10px] text-red-400 px-1">
            {error}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md p-6 rounded-2xl border border-white/10 bg-[#0A0A0A] shadow-2xl animate-drop-in">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <h3 className="text-lg font-medium text-white">
                Share Ratio
              </h3>
            </div>

            <div className="mb-8">
              <p className="text-sm mb-3 text-white/60">
                This will open in X's tweet composer as a <span className="text-blue-400 font-medium">quote tweet</span> of the ratio:
              </p>

              <div className="p-4 rounded-xl border border-white/10 bg-white/5 text-sm text-white/90 mb-3">
                <textarea
                  value={shareText}
                  onChange={(e) => setShareText(e.target.value)}
                  className="w-full bg-transparent border-none resize-none focus:ring-0 focus:outline-none font-sans leading-relaxed h-24 text-white"
                  placeholder="Write your tweet..."
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-white/40">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>Quoting: https://x.com/{replyAuthor}/status/{replyTweetId}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2.5 rounded-full text-sm font-mono uppercase tracking-wide border border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmShare}
                className="flex-1 px-4 py-2.5 rounded-full text-sm font-mono uppercase tracking-wide bg-white text-black hover:bg-white/90 transition-colors font-medium"
              >
                Open in X
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
