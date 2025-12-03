import "./index.css";
import React, { useState, useEffect, useCallback } from "react";
import { AuthButton } from './components/AuthButton';
import { ShareButton } from './components/ShareButton';
import { useAuth } from './hooks/useAuth';

// Type definitions
interface Reply {
  id: string;
  author: string;
  authorProfileImage?: string;
  content: string;
  likes: number;
  isRatio: boolean;
  isBrutalRatio: boolean;
  isLethalRatio: boolean;
  images?: string[];
}

interface Post {
  id: string;
  author: string;
  authorProfileImage?: string;
  content: string;
  likes: number;
  timestamp: string;
  replies: Reply[];
  images?: string[];
}

interface VictimLeaderboardEntry {
  username: string;
  profileImage?: string;
  ratioCount: number;
  totalLikes: number;
  worstRatio: {
    ratio: number;
    postId: string;
    postContent: string;
    postLikes: number;
    postImages?: string[];
    replyId: string;
    replyContent: string;
    replyLikes: number;
    replyAuthor: string;
    replyImages?: string[];
  };
}

interface PerpetratorLeaderboardEntry {
  username: string;
  profileImage?: string;
  ratioCount: number;
  totalLikes: number;
  bestRatio: {
    ratio: number;
    postId: string;
    postContent: string;
    postLikes: number;
    postAuthor: string;
    postImages?: string[];
    replyId: string;
    replyContent: string;
    replyLikes: number;
    replyImages?: string[];
  };
}

// Inline SVG components
const HeartIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M4.03553 1C1.80677 1 0 2.80677 0 5.03553C0 6.10582 0.42517 7.13228 1.18198 7.88909L7.14645 13.8536C7.34171 14.0488 7.65829 14.0488 7.85355 13.8536L13.818 7.88909C14.5748 7.13228 15 6.10582 15 5.03553C15 2.80677 13.1932 1 10.9645 1C9.89418 1 8.86772 1.42517 8.11091 2.18198L7.5 2.79289L6.88909 2.18198C6.13228 1.42517 5.10582 1 4.03553 1Z" fill="#e13737"/>
  </svg>
);

const PopoutIcon = ({ className }: { className?: string }) => (
  <svg fill="currentColor" width="16" height="16" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" className={className}>
    <path d="M15.694 13.541l2.666 2.665 5.016-5.017 2.59 2.59 0.004-7.734-7.785-0.046 2.526 2.525-5.017 5.017zM25.926 16.945l-1.92-1.947 0.035 9.007-16.015 0.009 0.016-15.973 8.958-0.040-2-2h-7c-1.104 0-2 0.896-2 2v16c0 1.104 0.896 2 2 2h16c1.104 0 2-0.896 2-2l-0.074-7.056z"/>
  </svg>
);

// X Logo SVG
const XLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
    <path d="M21.742 21.75l-7.563-11.179 7.056-8.321h-2.456l-5.691 6.714-4.54-6.714H2.359l7.29 10.776L2.25 21.75h2.456l6.035-7.118 4.818 7.118h6.191-.008zM7.739 3.818L18.81 20.182h-2.447L5.29 3.818h2.447z" fill="currentColor"/>
  </svg>
);

// Helper functions
const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const postTime = new Date(timestamp);
  const diffMs = now.getTime() - postTime.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return postTime.toLocaleDateString();
};

const cleanContent = (content: string): string => {
  return content.replace(/https:\/\/t\.co\/\w+/g, '').trim();
};

// Mock data
const mockPosts: Post[] = [
  {
    id: "1",
    author: "techguru",
    content: "Just launched my new AI startup! 🚀 Can't wait to see what the future holds.",
    likes: 750,
    timestamp: "2024-11-07T14:30:00Z",
    replies: [{
      id: "101",
      author: "skeptic_dev",
      content: "AI startups are so 2023. What's your unique value prop?",
      likes: 156,
      isRatio: false,
      isBrutalRatio: false,
      isLethalRatio: false
    }]
  }
];

// PostCard Component
const PostCard = ({ post, onUsernameClick }: { post: Post; onUsernameClick?: (username: string) => void }) => {
  const hasRatio = post.replies.some(reply => reply.likes > post.likes);
  const hasBrutalRatio = post.replies.some(reply => reply.likes >= post.likes * 10);
  const hasLethalRatio = post.replies.some(reply => reply.likes >= post.likes * 100);

  return (
    <div className={`rounded-2xl border p-4 sm:p-6 mb-4 sm:mb-6 card-hover transition-all ${
      hasLethalRatio
        ? 'border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/20'
        : hasBrutalRatio
        ? 'border-orange-500/50 bg-orange-500/10 shadow-lg shadow-orange-500/10'
        : hasRatio
        ? 'border-red-500/50 bg-red-500/5'
        : 'border-white/10 bg-white/5'
    }`}>
      {/* Original Post */}
      <div className="mb-4">
        <div className="flex items-center mb-3">
          <a
            href={`https://x.com/${post.author}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-3 hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0 overflow-hidden bg-white/10"
          >
            {post.authorProfileImage ? (
              <img src={post.authorProfileImage} alt={`@${post.author}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-medium">
                {post.author[0].toUpperCase()}
              </div>
            )}
          </a>
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => onUsernameClick?.(post.author)}
              className="font-medium text-white hover:text-white/80 transition-colors cursor-pointer"
            >
              @{post.author}
            </button>
            <span className="text-white/40">·</span>
            <span className="text-white/40 text-sm">{formatRelativeTime(post.timestamp)}</span>
            <a
              href={`https://x.com/${post.author}/status/${post.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 hover:text-white/60 transition-colors"
            >
              <PopoutIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
        <p className="text-white/90 text-sm sm:text-base mb-3 leading-relaxed">{cleanContent(post.content)}</p>

        {/* Post images */}
        {post.images && post.images.length > 0 && (
          <div className="mb-3">
            <div className={`grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {post.images.slice(0, 4).map((imageUrl, index) => (
                <div key={index} className="relative overflow-hidden rounded-xl bg-white/5">
                  <img
                    src={imageUrl}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(imageUrl, '_blank')}
                    style={{ aspectRatio: post.images!.length === 1 ? '16/9' : '1/1' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center text-white/50 text-sm">
          <span className="flex items-center gap-1.5">
            <HeartIcon className="w-4 h-4" />
            {post.likes.toLocaleString()} likes
          </span>
        </div>
      </div>

      {/* Replies */}
      {post.replies.length > 0 && (
        <div className="border-t border-white/10 pt-4">
          {post.replies.map(reply => (
            <div key={reply.id} className={`mb-3 p-3 sm:p-4 rounded-xl border transition-all ${
              reply.isLethalRatio
                ? 'border-purple-500/50 bg-purple-500/10'
                : reply.isBrutalRatio
                ? 'border-orange-500/50 bg-orange-500/10'
                : reply.isRatio
                ? 'border-red-500/50 bg-red-500/5'
                : 'border-white/10 bg-white/5'
            }`}>
              <div className="flex items-center mb-2 flex-wrap gap-2">
                <a
                  href={`https://x.com/${reply.author}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0 overflow-hidden bg-white/10"
                >
                  {reply.authorProfileImage ? (
                    <img src={reply.authorProfileImage} alt={`@${reply.author}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-medium text-sm">
                      {reply.author[0].toUpperCase()}
                    </div>
                  )}
                </a>
                <button
                  onClick={() => onUsernameClick?.(reply.author)}
                  className="font-medium text-white/80 hover:text-white text-sm transition-colors cursor-pointer"
                >
                  @{reply.author}
                </button>
                <a
                  href={`https://x.com/${reply.author}/status/${reply.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/40 hover:text-white/60 transition-colors"
                >
                  <PopoutIcon className="w-3 h-3" />
                </a>
                {reply.isLethalRatio && (
                  <span className="ml-auto bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">
                    💀 LETHAL
                  </span>
                )}
                {reply.isBrutalRatio && !reply.isLethalRatio && (
                  <span className="ml-auto bg-gradient-to-r from-orange-500 to-red-600 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                    🔥 BRUTAL
                  </span>
                )}
                {reply.isRatio && !reply.isBrutalRatio && !reply.isLethalRatio && (
                  <span className="ml-auto bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                    RATIO
                  </span>
                )}
              </div>
              <p className="text-white/80 text-xs sm:text-sm mb-2 leading-relaxed">{cleanContent(reply.content)}</p>

              {/* Reply images */}
              {reply.images && reply.images.length > 0 && (
                <div className="mb-2">
                  <div className={`grid gap-1 ${reply.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {reply.images.slice(0, 4).map((imageUrl, index) => (
                      <div key={index} className="relative overflow-hidden rounded-lg border border-white/10">
                        <img
                          src={imageUrl}
                          alt={`Reply image ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(imageUrl, '_blank')}
                          style={{ aspectRatio: reply.images!.length === 1 ? '16/9' : '1/1' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center text-xs gap-2">
                <span className="text-white/50 flex items-center gap-1">
                  <HeartIcon className="w-3 h-3" />
                  {reply.likes.toLocaleString()} likes
                </span>
                {reply.isLethalRatio && (
                  <span className="text-purple-400 font-semibold">
                    ({Math.round(reply.likes / post.likes * 10) / 10}x the original! 💀)
                  </span>
                )}
                {reply.isBrutalRatio && !reply.isLethalRatio && (
                  <span className="text-orange-400 font-semibold">
                    ({Math.round(reply.likes / post.likes * 10) / 10}x the original!)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Share Button */}
      <div className="flex justify-end pt-4 border-t border-white/10">
        <ShareButton
          ratio={post.replies[0]?.isRatio ? (post.replies[0].likes / post.likes) : 0}
          parentAuthor={post.author}
          replyAuthor={post.replies[0]?.author || ''}
          parentTweetId={post.id}
          replyTweetId={post.replies[0]?.id || ''}
        />
      </div>
    </div>
  );
};

export function App() {
  const [activeFeed, setActiveFeed] = useState<'recents' | 'victims' | 'perpetrators'>('recents');
  const [minLikes, setMinLikes] = useState(1000);
  const [sortBy, setSortBy] = useState<'recency' | 'brutality'>('recency');
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyBrutal, setShowOnlyBrutal] = useState(false);
  const [showOnlyLethal, setShowOnlyLethal] = useState(false);
  const [filterUsername, setFilterUsername] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [victimsLeaderboard, setVictimsLeaderboard] = useState<VictimLeaderboardEntry[]>([]);
  const [perpetratorsLeaderboard, setPerpetratorsLeaderboard] = useState<PerpetratorLeaderboardEntry[]>([]);
  const [totalRatios, setTotalRatios] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user: currentUser, isAuthenticated } = useAuth();

  // Convert stored ratio to Post format
  const convertRatioToPost = (ratio: any): Post => ({
    id: ratio.parent.id,
    author: ratio.parent.author,
    authorProfileImage: ratio.parent.authorProfileImage,
    content: ratio.parent.content,
    likes: ratio.parent.likes,
    timestamp: ratio.parent.timestamp,
    images: ratio.parent.images,
    replies: [{
      id: ratio.reply.id,
      author: ratio.reply.author,
      authorProfileImage: ratio.reply.authorProfileImage,
      content: ratio.reply.content,
      likes: ratio.reply.likes,
      images: ratio.reply.images,
      isRatio: ratio.isRatio,
      isBrutalRatio: ratio.isBrutalRatio,
      isLethalRatio: ratio.isLethalRatio || false
    }]
  });

  // WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
      console.log("📡 Connected to backend");
      setWsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case "connected":
            loadPosts(filterUsername || undefined);
            break;
          case "ratios_updated":
            loadPosts(filterUsername || undefined);
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
      setTimeout(() => window.location.reload(), 5000);
    };

    ws.onerror = () => setError("Connection to backend failed");

    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      ws.close();
    };
  }, []);

  const loadPosts = useCallback(async (usernameFilter?: string) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: '100',
        sortBy,
        showOnlyBrutal: showOnlyBrutal.toString(),
        showOnlyLethal: showOnlyLethal.toString(),
        minLikes: minLikes.toString(),
      });

      if (usernameFilter?.trim()) {
        params.append('username', usernameFilter.trim().toLowerCase().replace(/^@/, ''));
      }

      const response = await fetch(`/api/ratios?${params}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      setPosts(result.data.map(convertRatioToPost));
      setLastUpdate(Date.now());
      if (result.stats?.total) setTotalRatios(result.stats.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ratios");
    } finally {
      setLoading(false);
    }
  }, [sortBy, showOnlyBrutal, showOnlyLethal, minLikes]);

  useEffect(() => {
    if (wsConnected) loadPosts(filterUsername || undefined);
  }, [sortBy, showOnlyBrutal, showOnlyLethal, minLikes, loadPosts, wsConnected]);

  const loadLeaderboards = async () => {
    try {
      const response = await fetch("/api/leaderboards");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.success) {
        setVictimsLeaderboard(result.data.victims);
        setPerpetratorsLeaderboard(result.data.perpetrators);
      }
    } catch (err) {
      console.error("Error loading leaderboards:", err);
    }
  };

  const enrichUser = async (username: string) => {
    if (!username.trim()) return;
    try {
      setLoading(true);
      const cleanUsername = username.trim().replace(/^@/, '');
      const response = await fetch("/api/enrich-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enrich user");
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameClick = async (username: string) => {
    const cleanUsername = username.trim().replace(/^@/, '');
    setFilterUsername(cleanUsername);
    await enrichUser(cleanUsername);
    loadPosts(cleanUsername);
  };

  useEffect(() => {
    if (activeFeed === 'victims' || activeFeed === 'perpetrators') {
      loadLeaderboards();
    }
  }, [activeFeed]);

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === 'recency') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    const aMaxRatio = Math.max(...a.replies.map(reply => reply.likes / a.likes), 0);
    const bMaxRatio = Math.max(...b.replies.map(reply => reply.likes / b.likes), 0);
    return bMaxRatio - aMaxRatio;
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0A0A0A] text-white antialiased">
      {/* Header */}
      <header className="animate-drop-in-header fixed inset-x-0 top-0 z-50">
        <div className="pointer-events-none absolute inset-x-0 h-32 bg-gradient-to-b from-black/75 to-transparent"></div>
        <div className="relative mx-auto w-full max-w-7xl px-4 lg:px-6">
          <nav className="flex items-center justify-between gap-4 py-4 lg:h-20 lg:py-0">
            {/* Logo */}
            <a href="/" className="inline-flex shrink-0 items-center gap-3 group">
              <XLogo className="h-8 w-8 fill-white" />
              <span className="text-lg font-semibold tracking-tight hidden sm:block">
                Ratio Finder
              </span>
            </a>

            {/* Desktop Nav */}
            <ul className="hidden lg:flex items-center gap-1 ml-8">
              {['Recents', 'Most Ratio\'d', 'Top Ratio-ers'].map((item, i) => (
                <li key={item}>
                  <button
                    onClick={() => setActiveFeed(i === 0 ? 'recents' : i === 1 ? 'victims' : 'perpetrators')}
                    className={`px-4 py-2 font-mono text-sm tracking-wide uppercase transition-colors rounded-full ${
                      (i === 0 && activeFeed === 'recents') ||
                      (i === 1 && activeFeed === 'victims') ||
                      (i === 2 && activeFeed === 'perpetrators')
                        ? 'text-white bg-white/10'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                <span className="text-xs text-white/50 hidden sm:inline font-mono">
                  {wsConnected ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
              <AuthButton />
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden flex items-center justify-center rounded-full border border-white/25 p-2.5 hover:bg-white/10 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75ZM3 12a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 12Zm0 5.25a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </nav>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-black/95 backdrop-blur-lg">
            <div className="px-4 py-4 space-y-2">
              {['Recents', 'Most Ratio\'d', 'Top Ratio-ers'].map((item, i) => (
                <button
                  key={item}
                  onClick={() => {
                    setActiveFeed(i === 0 ? 'recents' : i === 1 ? 'victims' : 'perpetrators');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 font-mono text-sm tracking-wide uppercase transition-colors rounded-xl text-left ${
                    (i === 0 && activeFeed === 'recents') ||
                    (i === 1 && activeFeed === 'victims') ||
                    (i === 2 && activeFeed === 'perpetrators')
                      ? 'text-white bg-white/10'
                      : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative isolate h-[60vh] min-h-[500px] w-full overflow-hidden border-b border-white/10">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 [background:radial-gradient(100%_120%_at_50%_0%,rgba(0,0,0,0.6),transparent_60%)]"></div>
        </div>
        <div className="hero-light-ray"></div>
        <div className="hero-light-glow"></div>

        {/* Content */}
        <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl px-4 lg:px-6 pt-20">
          <div className="flex w-full items-center justify-center">
            <div className="animate-drop-in max-w-3xl space-y-6 text-center">
              <div className="mono-tag flex items-center justify-center gap-2">
                [<span>Real-Time Ratio Discovery</span>]
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-white leading-[1.1]">
                Find the Most Brutal Ratios on X
              </h1>
              <p className="mx-auto max-w-xl text-lg sm:text-xl text-white/60">
                Monitoring X in real-time to discover when replies completely dominate the original post.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => loadPosts(filterUsername || undefined)}
                  disabled={loading}
                  className="btn-glow inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-all hover:bg-white/90 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      Refresh Feed
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                        <path d="M16 16h5v5" />
                      </svg>
                    </>
                  )}
                </button>
                <a
                  href="https://console.x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm text-white transition-colors hover:bg-white/10"
                >
                  Powered by X API
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-white/10 p-4 lg:p-6 lg:min-h-screen lg:sticky lg:top-20 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
          <div className="space-y-6">
            {/* Stats */}
            <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
              <div className="mono-tag mb-3">[Stats]</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-semibold text-white">{totalRatios}</div>
                  <div className="text-xs text-white/50">Total Ratios</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-white">{posts.length}</div>
                  <div className="text-xs text-white/50">Showing</div>
                </div>
              </div>
            </div>

            {/* Sort */}
            <div>
              <div className="mono-tag mb-3">[Sort By]</div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recency' | 'brutality')}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
              >
                <option value="recency">🕒 Most Recent</option>
                <option value="brutality">💀 Most Brutal</option>
              </select>
            </div>

            {/* Filters */}
            <div>
              <div className="mono-tag mb-3">[Filters]</div>
              <div className="space-y-4">
                {/* Min Likes */}
                <div>
                  <label className="block text-sm text-white/60 mb-2">
                    Min. Reply Likes: <span className="text-white font-medium">{minLikes.toLocaleString()}</span>
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="10000"
                    step="100"
                    value={minLikes}
                    onChange={(e) => setMinLikes(Number(e.target.value))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-white/40 mt-1">
                    <span>1k</span>
                    <span>10k</span>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={showOnlyLethal}
                      onChange={(e) => {
                        setShowOnlyLethal(e.target.checked);
                        if (e.target.checked) setShowOnlyBrutal(false);
                      }}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border ${showOnlyLethal ? 'bg-purple-500 border-purple-500' : 'border-white/20 bg-white/5'} flex items-center justify-center transition-all`}>
                      {showOnlyLethal && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="ml-3 text-sm text-white/70 group-hover:text-white transition-colors">
                      Lethal only (100x+) 💀
                    </span>
                  </label>

                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={showOnlyBrutal}
                      onChange={(e) => {
                        setShowOnlyBrutal(e.target.checked);
                        if (e.target.checked) setShowOnlyLethal(false);
                      }}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border ${showOnlyBrutal ? 'bg-orange-500 border-orange-500' : 'border-white/20 bg-white/5'} flex items-center justify-center transition-all`}>
                      {showOnlyBrutal && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="ml-3 text-sm text-white/70 group-hover:text-white transition-colors">
                      Brutal only (10x+) 🔥
                    </span>
                  </label>
                </div>

                {/* Username filter */}
                <div>
                  <label className="block text-sm text-white/60 mb-2">Filter by User</label>
                  <input
                    type="text"
                    value={filterUsername}
                    onChange={(e) => setFilterUsername(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && filterUsername.trim()) {
                        await enrichUser(filterUsername);
                        loadPosts(filterUsername);
                      }
                    }}
                    placeholder="@username"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all text-sm"
                    disabled={loading}
                  />
                  {filterUsername && (
                    <button
                      onClick={() => {
                        setFilterUsername('');
                        loadPosts();
                      }}
                      className="mt-2 text-sm text-white/50 hover:text-white transition-colors"
                      disabled={loading}
                    >
                      Clear filter
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Feed */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-3xl mx-auto">
            {/* Feed Header */}
            <div className="mb-6">
              <div className="mono-tag mb-2">
                [{activeFeed === 'recents' ? 'Latest Ratios' : activeFeed === 'victims' ? 'Most Ratio\'d' : 'Top Ratio-ers'}]
              </div>
              <h2 className="text-2xl sm:text-3xl font-medium text-white">
                {activeFeed === 'recents'
                  ? 'Recent Ratio Discoveries'
                  : activeFeed === 'victims'
                  ? 'Hall of Shame'
                  : 'Ratio Champions'}
              </h2>
              <p className="text-white/50 mt-2">
                {activeFeed === 'recents'
                  ? 'Real-time monitoring of X for ratio opportunities'
                  : activeFeed === 'victims'
                  ? 'Users who got ratio\'d the most'
                  : 'Users who ratio\'d others the most'}
              </p>
            </div>

            {/* Error display */}
            {error && (
              <div className="rounded-2xl border border-red-500/50 bg-red-500/10 p-4 mb-6">
                <p className="text-red-400 font-medium mb-1">⚠️ Error</p>
                <p className="text-red-300/80 text-sm">{error}</p>
              </div>
            )}

            {/* Content */}
            {activeFeed === 'recents' ? (
              loading && posts.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-white mx-auto mb-4"></div>
                    <p className="text-white/50 font-mono text-sm">LOADING RATIOS...</p>
                  </div>
                </div>
              ) : sortedPosts.length > 0 ? (
                <div className="space-y-4">
                  {sortedPosts.map(post => (
                    <PostCard key={post.id} post={post} onUsernameClick={handleUsernameClick} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">📊</div>
                  <p className="text-white/50">No posts found matching your filters.</p>
                </div>
              )
            ) : activeFeed === 'victims' ? (
              <LeaderboardList
                entries={victimsLeaderboard}
                type="victim"
                totalRatios={totalRatios}
                onUsernameClick={handleUsernameClick}
              />
            ) : (
              <LeaderboardList
                entries={perpetratorsLeaderboard}
                type="perpetrator"
                totalRatios={totalRatios}
                onUsernameClick={handleUsernameClick}
              />
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-12">
        <div className="relative z-10 mx-auto max-w-7xl px-4 lg:px-6">
          <div className="flex flex-col items-center gap-6">
            <XLogo className="h-12 w-12 fill-white/20" />
            <p className="text-white/40 text-sm text-center">
              Built with X API. Not affiliated with X Corp.
            </p>
            <div className="flex items-center gap-6">
              <a href="https://console.x.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white text-sm transition-colors">
                Developer Console
              </a>
              <a href="https://docs.x.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white text-sm transition-colors">
                API Docs
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Leaderboard List Component
function LeaderboardList({
  entries,
  type,
  totalRatios,
  onUsernameClick
}: {
  entries: (VictimLeaderboardEntry | PerpetratorLeaderboardEntry)[];
  type: 'victim' | 'perpetrator';
  totalRatios: number;
  onUsernameClick: (username: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">📊</div>
        <h3 className="text-xl font-medium text-white mb-2">No Data Yet</h3>
        <p className="text-white/50">The leaderboard will populate as ratios are discovered.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl border border-white/10 bg-white/5">
        <div className="flex items-center justify-between text-sm text-white/50">
          <span>{type === 'victim' ? '😭' : '💀'} Top {entries.length} {type === 'victim' ? 'most ratio\'d' : 'ratio assassins'}</span>
          <span>From {totalRatios} total ratios</span>
        </div>
      </div>

      {entries.map((entry, index) => (
        <div
          key={entry.username}
          className={`rounded-2xl border p-4 sm:p-6 card-hover transition-all ${
            index === 0
              ? 'border-yellow-500/50 bg-yellow-500/10'
              : index === 1
              ? 'border-gray-400/50 bg-gray-400/10'
              : index === 2
              ? 'border-orange-600/50 bg-orange-600/10'
              : 'border-white/10 bg-white/5'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`text-2xl sm:text-3xl font-bold ${
                index === 0 ? 'text-yellow-500' :
                index === 1 ? 'text-gray-400' :
                index === 2 ? 'text-orange-600' :
                'text-white/40'
              }`}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
              </div>
              <a
                href={`https://x.com/${entry.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-white/10 hover:opacity-80 transition-opacity"
              >
                {entry.profileImage ? (
                  <img src={entry.profileImage} alt={`@${entry.username}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-medium">
                    {entry.username[0].toUpperCase()}
                  </div>
                )}
              </a>
              <div>
                <button
                  onClick={() => onUsernameClick(entry.username)}
                  className={`font-medium hover:opacity-80 transition-opacity text-base sm:text-lg ${
                    type === 'victim' ? 'text-red-400' : 'text-purple-400'
                  }`}
                >
                  @{entry.username}
                </button>
                <div className="text-xs sm:text-sm text-white/50 mt-0.5">
                  {type === 'victim' ? 'Got ratio\'d' : 'Ratio\'d'}{' '}
                  <span className={type === 'victim' ? 'text-red-400 font-semibold' : 'text-purple-400 font-semibold'}>
                    {entry.ratioCount}
                  </span>{' '}
                  time{entry.ratioCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/40">Total likes</div>
              <div className={`text-lg sm:text-xl font-semibold ${type === 'victim' ? 'text-red-400' : 'text-purple-400'}`}>
                {entry.totalLikes.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Best/Worst ratio preview */}
          <div className="border-t border-white/10 pt-4">
            {'worstRatio' in entry && entry.worstRatio && (
              <>
                <div className="text-xs sm:text-sm text-white/50 mb-2">
                  💀 Worst ratio: <span className="text-orange-400 font-semibold">{entry.worstRatio.ratio.toFixed(1)}x</span>
                </div>
                <div className="bg-white/5 rounded-xl p-3 mb-2">
                  <p className="text-white/40 text-xs mb-1">Their post:</p>
                  <p className="text-white/70 text-xs sm:text-sm line-clamp-2">{cleanContent(entry.worstRatio.postContent)}</p>
                </div>
                <div className={`rounded-xl p-3 border ${type === 'victim' ? 'border-red-500/30 bg-red-500/5' : 'border-purple-500/30 bg-purple-500/5'}`}>
                  <p className="text-white/40 text-xs mb-1">💀 Ratio'd by @{entry.worstRatio.replyAuthor}:</p>
                  <p className="text-white/80 text-xs sm:text-sm line-clamp-2">{cleanContent(entry.worstRatio.replyContent)}</p>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-red-400 font-semibold flex items-center gap-1">
                      <HeartIcon className="w-3 h-3" />
                      {entry.worstRatio.replyLikes.toLocaleString()}
                    </span>
                    <a
                      href={`https://x.com/${entry.worstRatio.replyAuthor}/status/${entry.worstRatio.replyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/50 hover:text-white transition-colors"
                    >
                      View →
                    </a>
                  </div>
                </div>
              </>
            )}
            {'bestRatio' in entry && entry.bestRatio && entry.bestRatio.ratio > 0 && (
              <>
                <div className="text-xs sm:text-sm text-white/50 mb-2">
                  🔥 Best ratio: <span className="text-purple-400 font-semibold">{entry.bestRatio.ratio.toFixed(1)}x</span>
                </div>
                <div className="bg-white/5 rounded-xl p-3 mb-2">
                  <p className="text-white/40 text-xs mb-1">Original by @{entry.bestRatio.postAuthor}:</p>
                  <p className="text-white/70 text-xs sm:text-sm line-clamp-2">{cleanContent(entry.bestRatio.postContent)}</p>
                </div>
                <div className="rounded-xl p-3 border border-purple-500/30 bg-purple-500/5">
                  <p className="text-white/40 text-xs mb-1">💀 Their reply:</p>
                  <p className="text-white/80 text-xs sm:text-sm line-clamp-2">{cleanContent(entry.bestRatio.replyContent)}</p>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-purple-400 font-semibold flex items-center gap-1">
                      <HeartIcon className="w-3 h-3" />
                      {entry.bestRatio.replyLikes.toLocaleString()}
                    </span>
                    <a
                      href={`https://x.com/${entry.username}/status/${entry.bestRatio.replyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/50 hover:text-white transition-colors"
                    >
                      View →
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
