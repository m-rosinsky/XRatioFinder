import "./index.css";
import { useState, useEffect, useCallback } from "react";
import heartIconUrl from "./assets/icons/heart.svg";
import popoutIconUrl from "./assets/icons/popout.svg";

// Type for our post data structure
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

// Helper function to format relative time
const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const postTime = new Date(timestamp);
  const diffMs = now.getTime() - postTime.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return postTime.toLocaleDateString();
  }
};

// Mock data for demonstration - used as fallback
const mockPosts: Post[] = [
  {
    id: "1",
    author: "techguru",
    content: "Just launched my new AI startup! 🚀 Can't wait to see what the future holds.",
    likes: 750,
    timestamp: "2024-11-07T14:30:00Z",
    replies: [
      {
        id: "101",
        author: "skeptic_dev",
        content: "AI startups are so 2023. What's your unique value prop?",
        likes: 156,
        isRatio: false,
        isBrutalRatio: false,
        isLethalRatio: false
      }
    ]
  },
  {
    id: "2",
    author: "design_master",
    content: "Flat design is dead. Time for brutalism in UI! 💀",
    likes: 1200,
    timestamp: "2024-11-07T13:15:00Z",
    replies: [
      {
        id: "201",
        author: "ux_lover",
        content: "Actually, brutalism has been around forever. It's not new.",
        likes: 2800,
        isRatio: true,
        isBrutalRatio: true,
        isLethalRatio: false
      }
    ]
  },
  {
    id: "3",
    author: "ceo_startup",
    content: "Our team just hit unicorn status! 🦄 Time to celebrate!",
    likes: 2500,
    timestamp: "2024-11-07T12:45:00Z",
    replies: [
      {
        id: "301",
        author: "finance_guru",
        content: "Unicorn? More like a donkey. Your valuation is inflated garbage.",
        likes: 150,
        isRatio: false,
        isBrutalRatio: false,
        isLethalRatio: false
      }
    ]
  },
  {
    id: "4",
    author: "influencer_pro",
    content: "Just dropped my new single! Stream it now 🎵 #NewMusic",
    likes: 3800,
    timestamp: "2024-11-07T11:20:00Z",
    replies: [
      {
        id: "401",
        author: "music_critic",
        content: "This is absolutely terrible. How do you even call yourself a musician?",
        likes: 42000,
        isRatio: true,
        isBrutalRatio: true,
        isLethalRatio: false
      }
    ]
  },
  {
    id: "5",
    author: "fitness_guru",
    content: "Lost 50lbs in 3 months with this ONE weird trick! 💪",
    likes: 5200,
    timestamp: "2024-11-07T10:10:00Z",
    replies: [
      {
        id: "501",
        author: "science_fan",
        content: "Please stop spreading misinformation. Weight loss requires diet + exercise.",
        likes: 58000,
        isRatio: true,
        isBrutalRatio: true,
        isLethalRatio: false
      }
    ]
  },
  {
    id: "6",
    author: "crypto_trader",
    content: "This coin is going to 1000x! Buy now before it's too late! 📈",
    likes: 6800,
    timestamp: "2024-11-07T09:30:00Z",
    replies: [
      {
        id: "601",
        author: "bear_market",
        content: "This is a rug pull waiting to happen. DYOR people.",
        likes: 1200,
        isRatio: false,
        isBrutalRatio: false,
        isLethalRatio: false
      }
    ]
  },
  {
    id: "7",
    author: "celebrity_news",
    content: "BREAKING: Major celebrity scandal drops! 🍿",
    likes: 8500,
    timestamp: "2024-11-07T08:45:00Z",
    replies: [
      {
        id: "701",
        author: "gossip_expert",
        content: "Old news. This was leaked weeks ago.",
        likes: 3400,
        isRatio: false,
        isBrutalRatio: false,
        isLethalRatio: false
      }
    ]
  },
  {
    id: "8",
    author: "politician_pro",
    content: "My new policy will change everything! Vote for change! 🗳️",
    likes: 9200,
    timestamp: "2024-11-07T07:15:00Z",
    replies: [
      {
        id: "801",
        author: "fact_checker",
        content: "Your facts are wrong. Here's the actual data...",
        likes: 5600,
        isRatio: false,
        isLethalRatio: false,
        isBrutalRatio: false
      }
    ]
  }
];

const PostCard = ({ post }: { post: Post }) => {
  const hasRatio = post.replies.some(reply => reply.likes > post.likes);
  const hasBrutalRatio = post.replies.some(reply => reply.likes >= post.likes * 10);
  const hasLethalRatio = post.replies.some(reply => reply.likes >= post.likes * 100);

  return (
    <div className={`bg-gray-800 rounded-lg border p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 ${
      hasLethalRatio
        ? 'border-purple-500 bg-purple-900/30 shadow-xl shadow-purple-500/30 ring-2 ring-purple-500/50'
        : hasBrutalRatio
        ? 'border-orange-500 bg-orange-900/30 shadow-lg shadow-orange-500/20'
        : hasRatio
        ? 'border-red-500 bg-red-900/20'
        : 'border-gray-700'
    }`}>
      {/* Original Post */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <a
            href={`https://x.com/${post.author}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 sm:mr-3 hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0 overflow-hidden bg-blue-500"
            title={`@${post.author}'s profile`}
          >
            {post.authorProfileImage ? (
              <img 
                src={post.authorProfileImage} 
                alt={`@${post.author}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                {post.author[0].toUpperCase()}
              </div>
            )}
          </a>
          <div className="flex items-center">
            <a
              href={`https://x.com/${post.author}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              @{post.author}
            </a>
            <span className="mx-2 text-gray-500">·</span>
            <span className="text-gray-400 text-sm">{formatRelativeTime(post.timestamp)}</span>
          </div>
          <a
            href={`https://x.com/${post.author}/status/${post.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-gray-500 hover:text-blue-400 transition-colors text-sm"
            title="View post on X"
          >
            <img src={popoutIconUrl} className="w-4 h-4" alt="View on X" />
          </a>
        </div>
        <p className="text-gray-200 text-sm sm:text-base mb-3">{post.content}</p>

        {/* Display images if available */}
        {post.images && post.images.length > 0 && (
          <div className="mb-3">
            <div className={`grid gap-2 ${
              post.images.length === 1 ? 'grid-cols-1' :
              post.images.length === 2 ? 'grid-cols-2' :
              post.images.length === 3 ? 'grid-cols-2' :
              'grid-cols-2'
            }`}>
              {post.images.slice(0, 4).map((imageUrl, index) => (
                <div
                  key={index}
                  className={`relative overflow-hidden rounded-lg bg-gray-700 ${
                    post.images!.length === 3 && index === 0 ? 'row-span-2' : ''
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(imageUrl, '_blank')}
                    style={{
                      aspectRatio: post.images!.length === 1 ? '16/9' :
                                   post.images!.length === 2 ? '1/1' :
                                   post.images!.length === 3 && index === 0 ? '1/2' :
                                   '1/1'
                    }}
                  />
                  {post.images!.length > 4 && index === 3 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-bold">+{post.images!.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center text-gray-400 text-sm">
          <span className="mr-4 flex items-center">
            <img src={heartIconUrl} className="w-4 h-4 mr-1" alt="likes" />
            {post.likes} likes
          </span>
          <span>{post.replies.length} replies</span>
        </div>
      </div>

      {/* Replies */}
      {post.replies.length > 0 && (
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-3">TOP REPLIES</h4>
          {post.replies.map(reply => (
            <div key={reply.id} className={`mb-3 p-3 rounded border ${
              reply.isLethalRatio
                ? 'border-purple-500 bg-purple-900/30 shadow-lg shadow-purple-500/20 ring-1 ring-purple-500/30'
                : reply.isBrutalRatio
                ? 'border-orange-500 bg-orange-900/20 shadow-md shadow-orange-500/10'
                : reply.isRatio
                ? 'border-red-500 bg-red-900/10'
                : 'border-gray-600 bg-gray-700/50'
            }`}>
              <div className="flex items-center mb-2">
                <a
                  href={`https://x.com/${reply.author}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2 hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0 overflow-hidden bg-purple-500"
                  title={`@${reply.author}'s profile`}
                >
                  {reply.authorProfileImage ? (
                    <img 
                      src={reply.authorProfileImage} 
                      alt={`@${reply.author}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                      {reply.author[0].toUpperCase()}
                    </div>
                  )}
                </a>
                <a
                  href={`https://x.com/${reply.author}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-purple-400 hover:text-purple-300 text-sm transition-colors"
                >
                  @{reply.author}
                </a>
                <a
                  href={`https://x.com/${reply.author}/status/${reply.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-gray-500 hover:text-purple-400 transition-colors text-xs"
                  title="View reply on X"
                >
                  <img src={popoutIconUrl} className="w-3 h-3" alt="View on X" />
                </a>
                {reply.isLethalRatio && (
                  <span className="ml-auto bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse shadow-md">
                    LETHAL!
                  </span>
                )}
                {reply.isBrutalRatio && !reply.isLethalRatio && (
                  <span className="ml-auto bg-gradient-to-r from-orange-500 to-red-600 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse">
                    BRUTAL!
                  </span>
                )}
                {reply.isRatio && !reply.isBrutalRatio && !reply.isLethalRatio && (
                  <span className="ml-auto bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                    RATIO!
                  </span>
                )}
              </div>
              <p className="text-gray-300 text-xs sm:text-sm mb-2">{reply.content}</p>

              {/* Display reply images if available */}
              {reply.images && reply.images.length > 0 && (
                <div className="mb-2">
                  <div className={`grid gap-1 ${
                    reply.images.length === 1 ? 'grid-cols-1' :
                    reply.images.length === 2 ? 'grid-cols-2' :
                    reply.images.length === 3 ? 'grid-cols-2' :
                    'grid-cols-2'
                  }`}>
                    {reply.images.slice(0, 4).map((imageUrl, index) => (
                      <div
                        key={index}
                        className={`relative overflow-hidden rounded border border-gray-600 ${
                          reply.images!.length === 3 && index === 0 ? 'row-span-2' : ''
                        }`}
                      >
                        <img
                          src={imageUrl}
                          alt={`Reply image ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(imageUrl, '_blank')}
                          style={{
                            aspectRatio: reply.images!.length === 1 ? '16/9' :
                                         reply.images!.length === 2 ? '1/1' :
                                         reply.images!.length === 3 && index === 0 ? '1/2' :
                                         '1/1'
                          }}
                        />
                        {reply.images!.length > 4 && index === 3 && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <span className="text-white font-bold text-xs">+{reply.images!.length - 4}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center text-gray-500 text-xs">
                <span className="flex items-center">
                  <img src={heartIconUrl} className="w-3 h-3 mr-1" alt="likes" />
                  {reply.likes} likes
                </span>
                {reply.isLethalRatio && (
                  <span className="ml-2 text-purple-400 font-bold">
                    ({Math.round(reply.likes / post.likes * 10) / 10}x the original! 💀💀💀)
                  </span>
                )}
                {reply.isBrutalRatio && !reply.isLethalRatio && (
                  <span className="ml-2 text-orange-400 font-semibold">
                    ({Math.round(reply.likes / post.likes * 10) / 10}x the original!)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
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

  // Convert stored ratio to Post format
  const convertRatioToPost = (ratio: any): Post => {
    return {
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
    };
  };

  // WebSocket connection for real-time updates
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
            // Initial connection - load data with current filters
            console.log(`📡 WebSocket connected, loading initial data`);
            loadPosts(filterUsername || undefined);
            break;

          case "ratios_updated":
            // Data updated on server - refresh with current filters
            console.log(`📊 Server data updated, refreshing view`);
            loadPosts(filterUsername || undefined);
            break;

          case "pong":
            // Heartbeat response
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };

    ws.onclose = () => {
      console.log("📡 Disconnected from backend");
      setWsConnected(false);
      // Auto-reconnect after 5 seconds
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("Connection to backend failed");
    };

    // Heartbeat to keep connection alive
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

  // Manual refresh - fetches current data from server without triggering new API poll
  const loadPosts = useCallback(async (usernameFilter?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters using current state values
      const params = new URLSearchParams({
        limit: '100',
        sortBy: sortBy,
        showOnlyBrutal: showOnlyBrutal.toString(),
        showOnlyLethal: showOnlyLethal.toString(),
        minLikes: minLikes.toString(),
      });

      // Add username filter if provided
      if (usernameFilter && usernameFilter.trim()) {
        params.append('username', usernameFilter.trim().toLowerCase().replace(/^@/, ''));
      }

      const response = await fetch(`/api/ratios?${params}`, { method: "GET" });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load ratios");
      }

      // Convert and set the posts
      const convertedPosts = result.data.map(convertRatioToPost);
      setPosts(convertedPosts);
      setLastUpdate(Date.now());
      
      // Update total ratios count from stats
      if (result.stats && result.stats.total) {
        setTotalRatios(result.stats.total);
      }

      console.log(`✅ Refreshed view: ${result.data.length} ratios loaded (${result.stats?.total || 0} total)`);
    } catch (err) {
      console.error("Error loading ratios:", err);
      setError(err instanceof Error ? err.message : "Failed to load ratios");
    } finally {
      setLoading(false);
    }
  }, [sortBy, showOnlyBrutal, showOnlyLethal, minLikes]); // Dependencies ensure fresh state values

  // Auto-refresh when filter states change (checkboxes and min likes)
  useEffect(() => {
    if (wsConnected) { // Only auto-refresh if WebSocket is connected
      console.log(`🔄 Filter state changed, auto-refreshing with current filters`);
      loadPosts(filterUsername || undefined);
    }
  }, [sortBy, showOnlyBrutal, showOnlyLethal, minLikes, loadPosts, wsConnected]); // Added minLikes to dependencies

  // Load leaderboards from backend
  const loadLeaderboards = async () => {
    try {
      const response = await fetch("/api/leaderboards", { method: "GET" });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to load leaderboards");
      }

      setVictimsLeaderboard(result.data.victims);
      setPerpetratorsLeaderboard(result.data.perpetrators);

      console.log(`✅ Leaderboards loaded: ${result.data.victims.length} victims, ${result.data.perpetrators.length} perpetrators`);
    } catch (err) {
      console.error("Error loading leaderboards:", err);
    }
  };

  // Enrich a user when they filter by username
  const enrichUser = async (username: string) => {
    if (!username.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const cleanUsername = username.trim().replace(/^@/, '');

      console.log(`🔍 Enriching user: ${cleanUsername}`);

      const response = await fetch("/api/enrich-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: cleanUsername }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to enrich user");
      }

      console.log(`✅ Enriched ${cleanUsername}: ${result.enrichedRatios} new ratios, ${result.totalTrackedUsers} total tracked users`);

      // WebSocket will automatically update the posts when enrichment completes

    } catch (err) {
      console.error("Error enriching user:", err);
      setError(err instanceof Error ? err.message : "Failed to enrich user");
    } finally {
      setLoading(false);
    }
  };

  // Posts are now filtered by backend, so use them directly
  const filteredByLikes = posts;

  // Sort the filtered posts
  const sortedPosts = [...filteredByLikes].sort((a, b) => {
    if (sortBy === 'recency') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else { // brutality
      const aMaxRatio = Math.max(...a.replies.map(reply => reply.likes / a.likes), 0);
      const bMaxRatio = Math.max(...b.replies.map(reply => reply.likes / b.likes), 0);
      return bMaxRatio - aMaxRatio;
    }
  });

  const filteredPosts = sortedPosts;

  // Calculate leaderboards
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

  // Load leaderboards when switching to leaderboard feeds
  useEffect(() => {
    if (activeFeed === 'victims' || activeFeed === 'perpetrators') {
      loadLeaderboards();
    }
  }, [activeFeed]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          <div className="flex items-center">
            <div className="text-xl sm:text-2xl mr-3">⚖️</div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              X Ratio Finder
            </h1>
            <div className="ml-2 sm:ml-4 flex items-center">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'} mr-1 sm:mr-2`}></div>
              <span className="text-xs text-gray-400 hidden sm:inline">
                {wsConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="text-xs sm:text-sm text-gray-400">powered by the X API</span>
            <div className="flex gap-1 sm:gap-2 md:gap-4 justify-center sm:justify-start">
              <a
                href="https://console.x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs underline transition-colors"
              >
                Console
              </a>
              <a
                href="https://x.com/XDevelopers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-xs underline transition-colors"
              >
                @XDevelopers
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Filters - Show only on mobile */}
      <div className="md:hidden bg-gray-800 border-b border-gray-700 px-4 py-4">
        <div className="flex flex-col gap-4">
          {/* Mobile Refresh Button */}
          <button
            onClick={() => loadPosts(filterUsername || undefined)}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-4 py-3 sm:py-3 rounded-lg text-sm font-semibold transition-colors min-h-[44px]"
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh View'}
          </button>

          {/* Mobile Sort and Filters */}
          <div className="grid grid-cols-2 gap-4">
            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recency' | 'brutality')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="recency">🕒 Recent</option>
                <option value="brutality">💀 Brutal</option>
              </select>
            </div>

            {/* Min Likes Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Min Likes: {minLikes.toLocaleString()}
              </label>
              <input
                type="range"
                min="1000"
                max="10000"
                step="100"
                value={minLikes}
                onChange={(e) => setMinLikes(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1k</span>
                <span>10k</span>
              </div>
            </div>
          </div>

          {/* Mobile Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={showOnlyBrutal}
                onChange={(e) => setShowOnlyBrutal(e.target.checked)}
                className="mr-3 w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm">Show only brutal ratios (10x+)</span>
            </label>

            <label className="flex items-center cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={showOnlyLethal}
                onChange={(e) => setShowOnlyLethal(e.target.checked)}
                className="mr-3 w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm">Show only lethal ratios (100x+)</span>
            </label>
          </div>

          {/* Mobile User Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Filter by User
            </label>
            <input
              type="text"
              value={filterUsername}
              onChange={(e) => setFilterUsername(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && filterUsername.trim()) {
                  // First enrich the user to ensure we have their data
                  await enrichUser(filterUsername);
                  // Then load posts filtered by that user
                  loadPosts(filterUsername);
                }
              }}
              placeholder="@username (press Enter)"
              className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[44px]"
              disabled={loading}
            />
            {filterUsername && (
              <button
                onClick={() => {
                  setFilterUsername('');
                  loadPosts(); // Reload without filter
                }}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors min-h-[44px] py-2"
                disabled={loading}
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <aside className="hidden md:block w-80 bg-gray-800 border-r border-gray-700 p-6 min-h-screen">
          {/* Refresh Button */}
          <button
            onClick={() => loadPosts(filterUsername || undefined)}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-4 py-3 rounded-lg text-sm font-semibold transition-colors mb-6 min-h-[44px]"
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh View'}
          </button>

          <div className="mt-2">
            <h3 className="text-md font-semibold mb-4 text-gray-200">Sort By</h3>
            <div className="mb-6">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recency' | 'brutality')}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="recency">🕒 Most Recent</option>
                <option value="brutality">💀 Most Brutal</option>
              </select>
            </div>

            <h3 className="text-md font-semibold mb-4 text-gray-200">Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min. Reply Likes: {minLikes.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="100"
                  value={minLikes}
                  onChange={(e) => setMinLikes(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1k</span>
                  <span>10k</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Showing {filteredPosts.length} of {totalRatios} ratios
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={showOnlyLethal}
                    onChange={(e) => {
                      setShowOnlyLethal(e.target.checked);
                      if (e.target.checked) setShowOnlyBrutal(false);
                    }}
                    className="mr-3 w-5 h-5 cursor-pointer"
                  />
                  <span className="text-sm">Show only lethal ratios (100x+)</span>
                </label>
                <label className="flex items-center cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={showOnlyBrutal}
                    onChange={(e) => {
                      setShowOnlyBrutal(e.target.checked);
                      if (e.target.checked) setShowOnlyLethal(false);
                    }}
                    className="mr-3 w-5 h-5 cursor-pointer"
                  />
                  <span className="text-sm">Show only brutal ratios (10x+)</span>
                </label>
              </div>

              {/* User Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Filter by User
                </label>
                <input
                  type="text"
                  value={filterUsername}
                  onChange={(e) => setFilterUsername(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && filterUsername.trim()) {
                      // First enrich the user to ensure we have their data
                      await enrichUser(filterUsername);
                      // Then load posts filtered by that user
                      loadPosts(filterUsername);
                    }
                  }}
                  placeholder="@username or username (press Enter to filter)"
                  className="w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[44px]"
                  disabled={loading}
                />
                {filterUsername && (
                  <button
                    onClick={() => {
                      setFilterUsername('');
                      loadPosts(); // Reload without filter
                    }}
                    className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors min-h-[44px] py-2"
                    disabled={loading}
                  >
                    Clear filter
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Shows ratios where user was ratio'd or did the ratioing. Entering a username automatically enriches their timeline for missed ratios.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            {/* Feed Tabs */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4 border-b border-gray-700">
                <button
                  onClick={() => setActiveFeed('recents')}
                  className={`px-3 sm:px-4 py-2 sm:py-2 font-semibold transition-all relative cursor-pointer text-sm sm:text-base ${
                    activeFeed === 'recents'
                      ? 'text-blue-400'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  Recents
                  {activeFeed === 'recents' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveFeed('victims')}
                  className={`px-3 sm:px-4 py-2 sm:py-2 font-semibold transition-all relative cursor-pointer text-sm sm:text-base ${
                    activeFeed === 'victims'
                      ? 'text-blue-400'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  😭 Most Ratio'd
                  {activeFeed === 'victims' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveFeed('perpetrators')}
                  className={`px-3 sm:px-4 py-2 sm:py-2 font-semibold transition-all relative cursor-pointer text-sm sm:text-base ${
                    activeFeed === 'perpetrators'
                      ? 'text-blue-400'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  💀 Top Ratio-ers
                  {activeFeed === 'perpetrators' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></div>
                  )}
                </button>
              </div>
              
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-200 mb-2">
                  {activeFeed === 'recents'
                    ? 'Latest Posts & Ratios'
                    : activeFeed === 'victims'
                    ? 'Most Ratio\'d Users'
                    : 'Top Ratio-ers'}
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm">
                  {activeFeed === 'recents'
                    ? 'Monitoring X for ratio opportunities in real-time (last 7 days)'
                    : activeFeed === 'victims'
                    ? 'Users who got ratio\'d the most in the past 7 days'
                    : 'Users who ratio\'d others the most in the past 7 days'}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
                <p className="text-red-400 font-semibold mb-2">⚠️ Error Loading Posts</p>
                <p className="text-red-300 text-sm">{error}</p>
                <p className="text-gray-400 text-xs mt-2">
                  Make sure to update the BEARER_TOKEN in src/utils/x-api.ts
                </p>
              </div>
            )}

            {activeFeed === 'recents' ? (
              // Recents Feed
              loading && posts.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading posts from X...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredPosts.length > 0 ? (
                    filteredPosts.map(post => (
                      <PostCard key={post.id} post={post} />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400">No posts found matching your filters.</p>
                    </div>
                  )}
                </div>
              )
            ) : activeFeed === 'victims' ? (
              // Victims Leaderboard Feed
              <div className="space-y-4">
                {victimsLeaderboard.length > 0 ? (
                  <>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>😭 Top {victimsLeaderboard.length} most ratio'd users</span>
                        <span>From {totalRatios} total ratios</span>
                      </div>
                    </div>
                    
                    {victimsLeaderboard.map((entry, index) => (
                      <div
                        key={entry.username}
                        className={`bg-gray-800 rounded-lg border p-3 sm:p-4 md:p-6 ${
                          index === 0
                            ? 'border-yellow-500 bg-yellow-900/20 shadow-lg shadow-yellow-500/20'
                            : index === 1
                            ? 'border-gray-400 bg-gray-700/20'
                            : index === 2
                            ? 'border-orange-600 bg-orange-900/20'
                            : 'border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex items-center">
                            <div className={`text-2xl sm:text-3xl font-bold mr-2 sm:mr-4 ${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-gray-400' :
                              index === 2 ? 'text-orange-600' :
                              'text-gray-500'
                            }`}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                            </div>

                            <a
                              href={`https://x.com/${entry.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-2 sm:mr-3 hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0 overflow-hidden bg-blue-500"
                              title={`@${entry.username}'s profile`}
                            >
                              {entry.profileImage ? (
                                <img 
                                  src={entry.profileImage} 
                                  alt={`@${entry.username}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                  {entry.username[0].toUpperCase()}
                                </div>
                              )}
                            </a>
                            
                            <div>
                              <a
                                href={`https://x.com/${entry.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-blue-400 hover:text-blue-300 transition-colors text-base sm:text-lg"
                              >
                                @{entry.username}
                              </a>
                              <div className="text-xs sm:text-sm text-gray-400 mt-1">
                                Got ratio'd <span className="text-red-400 font-bold">{entry.ratioCount}</span> time{entry.ratioCount !== 1 ? 's' : ''} this week
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-xs sm:text-sm text-gray-400">Total likes against</div>
                            <div className="text-lg sm:text-xl font-bold text-red-400">
                              {entry.totalLikes.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-700 pt-3 sm:pt-4">
                          <div className="text-xs sm:text-sm text-gray-400 mb-2">
                            💀 Worst ratio: <span className="text-orange-400 font-bold">{entry.worstRatio.ratio.toFixed(1)}x</span>
                          </div>
                          <div className="bg-gray-900/50 rounded p-2 sm:p-3 mb-2 sm:mb-3">
                            <p className="text-gray-500 text-xs mb-1">Their post:</p>
                            <p className="text-gray-300 text-xs sm:text-sm mb-2">{entry.worstRatio.postContent}</p>

                            {/* Display post images if available */}
                            {entry.worstRatio.postImages && entry.worstRatio.postImages.length > 0 && (
                              <div className="mb-2">
                                <div className={`grid gap-1 ${
                                  entry.worstRatio.postImages.length === 1 ? 'grid-cols-1' :
                                  entry.worstRatio.postImages.length === 2 ? 'grid-cols-2' :
                                  'grid-cols-2'
                                }`}>
                                  {entry.worstRatio.postImages.slice(0, 2).map((imageUrl, index) => (
                                    <div key={index} className="relative overflow-hidden rounded border border-gray-600">
                                      <img
                                        src={imageUrl}
                                        alt={`Post image ${index + 1}`}
                                        className="w-full h-16 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => window.open(imageUrl, '_blank')}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-gray-500 text-xs">
                              <span className="flex items-center">
                                <img src={heartIconUrl} className="w-3 h-3 mr-1" alt="likes" />
                                {entry.worstRatio.postLikes} likes
                              </span>
                              <a
                                href={`https://x.com/${entry.username}/status/${entry.worstRatio.postId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                View post →
                              </a>
                            </div>
                          </div>
                          <div className="bg-red-900/20 rounded p-2 sm:p-3 border border-red-500/30">
                            <p className="text-gray-500 text-xs mb-1">💀 Ratio'd by @{entry.worstRatio.replyAuthor}:</p>
                            <p className="text-gray-200 text-xs sm:text-sm mb-2">{entry.worstRatio.replyContent}</p>

                            {/* Display reply images if available */}
                            {entry.worstRatio.replyImages && entry.worstRatio.replyImages.length > 0 && (
                              <div className="mb-2">
                                <div className={`grid gap-1 ${
                                  entry.worstRatio.replyImages.length === 1 ? 'grid-cols-1' :
                                  entry.worstRatio.replyImages.length === 2 ? 'grid-cols-2' :
                                  'grid-cols-2'
                                }`}>
                                  {entry.worstRatio.replyImages.slice(0, 2).map((imageUrl, index) => (
                                    <div key={index} className="relative overflow-hidden rounded border border-red-500/30">
                                      <img
                                        src={imageUrl}
                                        alt={`Reply image ${index + 1}`}
                                        className="w-full h-16 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => window.open(imageUrl, '_blank')}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-red-400 font-bold flex items-center">
                                <img src={heartIconUrl} className="w-3 h-3 mr-1" alt="likes" />
                                {entry.worstRatio.replyLikes.toLocaleString()} likes
                              </span>
                              <a
                                href={`https://x.com/${entry.worstRatio.replyAuthor}/status/${entry.worstRatio.replyId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-400 hover:text-red-300"
                              >
                                View reply →
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md mx-auto">
                      <div className="text-6xl mb-4">📊</div>
                      <h3 className="text-xl font-semibold text-gray-200 mb-2">No Data Yet</h3>
                      <p className="text-gray-400">
                        The leaderboard will populate as ratios are discovered.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Perpetrators Leaderboard Feed
              <div className="space-y-4">
                {perpetratorsLeaderboard.length > 0 ? (
                  <>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span>💀 Top {perpetratorsLeaderboard.length} ratio assassins</span>
                        <span>From {totalRatios} total ratios</span>
                      </div>
                    </div>
                    
                    {perpetratorsLeaderboard.map((entry, index) => (
                      <div
                        key={entry.username}
                        className={`bg-gray-800 rounded-lg border p-3 sm:p-4 md:p-6 ${
                          index === 0
                            ? 'border-yellow-500 bg-yellow-900/20 shadow-lg shadow-yellow-500/20'
                            : index === 1
                            ? 'border-gray-400 bg-gray-700/20'
                            : index === 2
                            ? 'border-orange-600 bg-orange-900/20'
                            : 'border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <div className="flex items-center">
                            <div className={`text-2xl sm:text-3xl font-bold mr-2 sm:mr-4 ${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-gray-400' :
                              index === 2 ? 'text-orange-600' :
                              'text-gray-500'
                            }`}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                            </div>

                            <a
                              href={`https://x.com/${entry.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-2 sm:mr-3 hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0 overflow-hidden bg-purple-500"
                              title={`@${entry.username}'s profile`}
                            >
                              {entry.profileImage ? (
                                <img 
                                  src={entry.profileImage} 
                                  alt={`@${entry.username}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                  {entry.username[0].toUpperCase()}
                                </div>
                              )}
                            </a>
                            
                            <div>
                              <a
                                href={`https://x.com/${entry.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-purple-400 hover:text-purple-300 transition-colors text-base sm:text-lg"
                              >
                                @{entry.username}
                              </a>
                              <div className="text-xs sm:text-sm text-gray-400 mt-1">
                                Ratio'd <span className="text-purple-400 font-bold">{entry.ratioCount}</span> user{entry.ratioCount !== 1 ? 's' : ''} this week
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-xs sm:text-sm text-gray-400">Total likes earned</div>
                            <div className="text-lg sm:text-xl font-bold text-purple-400">
                              {entry.totalLikes.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-700 pt-3 sm:pt-4">
                          <div className="text-xs sm:text-sm text-gray-400 mb-2">
                            🔥 Best ratio: <span className="text-purple-400 font-bold">{entry.bestRatio.ratio.toFixed(1)}x</span>
                          </div>
                          <div className="bg-gray-900/50 rounded p-2 sm:p-3 mb-2 sm:mb-3">
                            <p className="text-gray-500 text-xs mb-1">Original post by @{entry.bestRatio.postAuthor}:</p>
                            <p className="text-gray-300 text-xs sm:text-sm mb-2">{entry.bestRatio.postContent}</p>

                            {/* Display post images if available */}
                            {entry.bestRatio.postImages && entry.bestRatio.postImages.length > 0 && (
                              <div className="mb-2">
                                <div className={`grid gap-1 ${
                                  entry.bestRatio.postImages.length === 1 ? 'grid-cols-1' :
                                  entry.bestRatio.postImages.length === 2 ? 'grid-cols-2' :
                                  'grid-cols-2'
                                }`}>
                                  {entry.bestRatio.postImages.slice(0, 2).map((imageUrl, index) => (
                                    <div key={index} className="relative overflow-hidden rounded border border-gray-600">
                                      <img
                                        src={imageUrl}
                                        alt={`Post image ${index + 1}`}
                                        className="w-full h-16 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => window.open(imageUrl, '_blank')}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-gray-500 text-xs">
                              <span className="flex items-center">
                                <img src={heartIconUrl} className="w-3 h-3 mr-1" alt="likes" />
                                {entry.bestRatio.postLikes} likes
                              </span>
                              <a
                                href={`https://x.com/${entry.bestRatio.postAuthor}/status/${entry.bestRatio.postId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                View post →
                              </a>
                            </div>
                          </div>
                          <div className="bg-purple-900/20 rounded p-2 sm:p-3 border border-purple-500/30">
                            <p className="text-gray-500 text-xs mb-1">💀 Their reply:</p>
                            <p className="text-gray-200 text-xs sm:text-sm mb-2">{entry.bestRatio.replyContent}</p>

                            {/* Display reply images if available */}
                            {entry.bestRatio.replyImages && entry.bestRatio.replyImages.length > 0 && (
                              <div className="mb-2">
                                <div className={`grid gap-1 ${
                                  entry.bestRatio.replyImages.length === 1 ? 'grid-cols-1' :
                                  entry.bestRatio.replyImages.length === 2 ? 'grid-cols-2' :
                                  'grid-cols-2'
                                }`}>
                                  {entry.bestRatio.replyImages.slice(0, 2).map((imageUrl, index) => (
                                    <div key={index} className="relative overflow-hidden rounded border border-purple-500/30">
                                      <img
                                        src={imageUrl}
                                        alt={`Reply image ${index + 1}`}
                                        className="w-full h-16 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => window.open(imageUrl, '_blank')}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-purple-400 font-bold flex items-center">
                                <img src={heartIconUrl} className="w-3 h-3 mr-1" alt="likes" />
                                {entry.bestRatio.replyLikes.toLocaleString()} likes
                              </span>
                              <a
                                href={`https://x.com/${entry.username}/status/${entry.bestRatio.replyId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300"
                              >
                                View reply →
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md mx-auto">
                      <div className="text-6xl mb-4">📊</div>
                      <h3 className="text-xl font-semibold text-gray-200 mb-2">No Data Yet</h3>
                      <p className="text-gray-400">
                        The leaderboard will populate as ratios are discovered.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
