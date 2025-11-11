import "./index.css";
import { useState, useEffect } from "react";

// Type for our post data structure
interface Post {
  id: string;
  author: string;
  authorProfileImage?: string;
  content: string;
  likes: number;
  timestamp: string;
  replies: Reply[];
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
    <div className={`bg-gray-800 rounded-lg border p-6 mb-6 ${
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
            className="w-10 h-10 rounded-full mr-3 hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0 overflow-hidden bg-blue-500"
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
            🔗
          </a>
          {hasLethalRatio && (
            <span className="ml-auto bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white px-3 py-1 rounded text-sm font-bold animate-pulse shadow-lg">
              ☠️ LETHAL RATIO
            </span>
          )}
          {hasBrutalRatio && !hasLethalRatio && (
            <span className="ml-auto bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-1 rounded text-sm font-bold animate-pulse">
              💀 BRUTAL RATIO
            </span>
          )}
          {hasRatio && !hasBrutalRatio && !hasLethalRatio && (
            <span className="ml-auto bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
              🔥 RATIO
            </span>
          )}
        </div>
        <p className="text-gray-200 mb-3">{post.content}</p>
        <div className="flex items-center text-gray-400 text-sm">
          <span className="mr-4">❤️ {post.likes} likes</span>
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
                  className="w-8 h-8 rounded-full mr-2 hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0 overflow-hidden bg-purple-500"
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
                  🔗
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
              <p className="text-gray-300 text-sm mb-2">{reply.content}</p>
              <div className="flex items-center text-gray-500 text-xs">
                <span>❤️ {reply.likes} likes</span>
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

  // Convert stored ratio to Post format
  const convertRatioToPost = (ratio: any): Post => {
    return {
      id: ratio.parent.id,
      author: ratio.parent.author,
      authorProfileImage: ratio.parent.authorProfileImage,
      content: ratio.parent.content,
      likes: ratio.parent.likes,
      timestamp: ratio.parent.timestamp,
      replies: [{
        id: ratio.reply.id,
        author: ratio.reply.author,
        authorProfileImage: ratio.reply.authorProfileImage,
        content: ratio.reply.content,
        likes: ratio.reply.likes,
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
          case "initial_data":
          case "ratios_updated":
            console.log(`📊 Received ${message.data.length} ratios from backend`);
            const convertedPosts = message.data.map(convertRatioToPost);
            setPosts(convertedPosts.length > 0 ? convertedPosts : mockPosts);
            setLastUpdate(Date.now());
            setLoading(false);
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
  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/ratios", { method: "GET" });

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

      console.log(`✅ Refreshed view: ${result.data.length} ratios loaded`);
    } catch (err) {
      console.error("Error loading ratios:", err);
      setError(err instanceof Error ? err.message : "Failed to load ratios");
    } finally {
      setLoading(false);
    }
  };

  // Filter posts based on reply likes, ratio flags, and username (client-side filtering)
  const filteredByLikes = posts.filter(post => {
    // Check if any reply meets the minimum likes threshold
    const meetsLikesThreshold = post.replies.some(reply => reply.likes >= minLikes);
    
    // Filter by username if specified (exact match, case-insensitive)
    if (filterUsername.trim()) {
      const cleanUsername = filterUsername.trim().toLowerCase().replace(/^@/, '');
      const postAuthor = post.author.toLowerCase();
      const replyAuthors = post.replies.map(r => r.author.toLowerCase());
      
      const matchesUsername = postAuthor === cleanUsername || replyAuthors.includes(cleanUsername);
      if (!matchesUsername) {
        return false;
      }
    }
    
    // If "show only lethal" is enabled, check for lethal ratios (takes priority)
    if (showOnlyLethal) {
      const hasLethalRatio = post.replies.some(reply => reply.isLethalRatio);
      return meetsLikesThreshold && hasLethalRatio;
    }
    
    // If "show only brutal" is enabled, check for brutal ratios
    if (showOnlyBrutal) {
      const hasBrutalRatio = post.replies.some(reply => reply.isBrutalRatio);
      return meetsLikesThreshold && hasBrutalRatio;
    }
    
    return meetsLikesThreshold;
  });

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
    name: string;
    profileImage?: string;
    ratioCount: number;
    totalLikesAgainst: number;
    worstRatio: {
      ratio: number;
      post: Post;
    };
  }

  interface PerpetratorLeaderboardEntry {
    username: string;
    name: string;
    profileImage?: string;
    ratioCount: number;
    totalLikesDealt: number;
    bestRatio: {
      ratio: number;
      post: Post;
      reply: Reply;
    };
  }

  // Victims Leaderboard - users who got ratio'd the most
  const victimsLeaderboard: VictimLeaderboardEntry[] = (() => {
    const userStats = new Map<string, VictimLeaderboardEntry>();

    posts.forEach(post => {
      post.replies.forEach(reply => {
        if (reply.isRatio) {
          const username = post.author;
          const ratio = reply.likes / post.likes;

          if (!userStats.has(username)) {
            userStats.set(username, {
              username,
              name: username,
              profileImage: post.authorProfileImage,
              ratioCount: 0,
              totalLikesAgainst: 0,
              worstRatio: {
                ratio: 0,
                post: post
              }
            });
          }

          const stats = userStats.get(username)!;
          stats.ratioCount++;
          stats.totalLikesAgainst += reply.likes;

          if (ratio > stats.worstRatio.ratio) {
            stats.worstRatio = { ratio, post };
          }
        }
      });
    });

    return Array.from(userStats.values())
      .sort((a, b) => b.ratioCount - a.ratioCount)
      .slice(0, 50);
  })();

  // Perpetrators Leaderboard - users who ratio'd others the most
  const perpetratorsLeaderboard: PerpetratorLeaderboardEntry[] = (() => {
    const userStats = new Map<string, PerpetratorLeaderboardEntry>();

    posts.forEach(post => {
      post.replies.forEach(reply => {
        if (reply.isRatio) {
          const username = reply.author;
          const ratio = reply.likes / post.likes;

          if (!userStats.has(username)) {
            userStats.set(username, {
              username,
              name: username,
              profileImage: reply.authorProfileImage,
              ratioCount: 0,
              totalLikesDealt: 0,
              bestRatio: {
                ratio: 0,
                post: post,
                reply: reply
              }
            });
          }

          const stats = userStats.get(username)!;
          stats.ratioCount++;
          stats.totalLikesDealt += reply.likes;

          if (ratio > stats.bestRatio.ratio) {
            stats.bestRatio = { ratio, post, reply };
          }
        }
      });
    });

    return Array.from(userStats.values())
      .sort((a, b) => b.ratioCount - a.ratioCount)
      .slice(0, 50);
  })();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-2xl mr-3">⚖️</div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              X Ratio Finder
            </h1>
            <div className="ml-4 flex items-center">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
              <span className="text-xs text-gray-400">
                {wsConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">powered by the X API</span>
            <a
              href="https://console.x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
            >
              Console
            </a>
            <a
              href="https://x.com/XDevelopers"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
            >
              Follow @XDevelopers
            </a>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-80 bg-gray-800 border-r border-gray-700 p-6 min-h-screen">
          {/* Refresh Button */}
          <button
            onClick={loadPosts}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-4 py-3 rounded-lg text-sm font-semibold transition-colors mb-6"
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
                  Showing {filteredPosts.length} of {posts.length} ratios
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showOnlyLethal}
                    onChange={(e) => {
                      setShowOnlyLethal(e.target.checked);
                      if (e.target.checked) setShowOnlyBrutal(false);
                    }}
                    className="mr-2 cursor-pointer" 
                  />
                  <span className="text-sm">Show only lethal ratios (100x+)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showOnlyBrutal}
                    onChange={(e) => {
                      setShowOnlyBrutal(e.target.checked);
                      if (e.target.checked) setShowOnlyLethal(false);
                    }}
                    className="mr-2 cursor-pointer" 
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
                  placeholder="@username or username"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {filterUsername && (
                  <button
                    onClick={() => setFilterUsername('')}
                    className="mt-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Clear filter
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Shows ratios where user was ratio'd or did the ratioing
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Feed Tabs */}
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4 border-b border-gray-700">
                <button
                  onClick={() => setActiveFeed('recents')}
                  className={`px-4 py-2 font-semibold transition-all relative cursor-pointer ${
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
                  className={`px-4 py-2 font-semibold transition-all relative cursor-pointer ${
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
                  className={`px-4 py-2 font-semibold transition-all relative cursor-pointer ${
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
                <h2 className="text-xl font-semibold text-gray-200 mb-2">
                  {activeFeed === 'recents' 
                    ? 'Latest Posts & Ratios' 
                    : activeFeed === 'victims'
                    ? 'Most Ratio\'d Users'
                    : 'Top Ratio-ers'}
                </h2>
                <p className="text-gray-400 text-sm">
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
                        <span>From {posts.length} total ratios</span>
                      </div>
                    </div>
                    
                    {victimsLeaderboard.map((entry, index) => (
                      <div 
                        key={entry.username}
                        className={`bg-gray-800 rounded-lg border p-6 ${
                          index === 0 
                            ? 'border-yellow-500 bg-yellow-900/20 shadow-lg shadow-yellow-500/20'
                            : index === 1
                            ? 'border-gray-400 bg-gray-700/20'
                            : index === 2
                            ? 'border-orange-600 bg-orange-900/20'
                            : 'border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className={`text-3xl font-bold mr-4 ${
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
                              className="w-12 h-12 rounded-full mr-3 hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0 overflow-hidden bg-blue-500"
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
                                className="font-semibold text-blue-400 hover:text-blue-300 transition-colors text-lg"
                              >
                                @{entry.username}
                              </a>
                              <div className="text-sm text-gray-400 mt-1">
                                Got ratio'd <span className="text-red-400 font-bold">{entry.ratioCount}</span> time{entry.ratioCount !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Total likes against</div>
                            <div className="text-xl font-bold text-red-400">
                              {entry.totalLikesAgainst.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-700 pt-4">
                          <div className="text-sm text-gray-400 mb-2">
                            💀 Worst ratio: <span className="text-orange-400 font-bold">{entry.worstRatio.ratio.toFixed(1)}x</span>
                          </div>
                          <div className="bg-gray-900/50 rounded p-3">
                            <p className="text-gray-300 text-sm mb-2">{entry.worstRatio.post.content}</p>
                            <div className="flex items-center text-gray-500 text-xs">
                              <span className="mr-4">❤️ {entry.worstRatio.post.likes} likes</span>
                              <a
                                href={`https://x.com/${entry.worstRatio.post.author}/status/${entry.worstRatio.post.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                View post →
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
                        <span>From {posts.length} total ratios</span>
                      </div>
                    </div>
                    
                    {perpetratorsLeaderboard.map((entry, index) => (
                      <div 
                        key={entry.username}
                        className={`bg-gray-800 rounded-lg border p-6 ${
                          index === 0 
                            ? 'border-yellow-500 bg-yellow-900/20 shadow-lg shadow-yellow-500/20'
                            : index === 1
                            ? 'border-gray-400 bg-gray-700/20'
                            : index === 2
                            ? 'border-orange-600 bg-orange-900/20'
                            : 'border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className={`text-3xl font-bold mr-4 ${
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
                              className="w-12 h-12 rounded-full mr-3 hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0 overflow-hidden bg-purple-500"
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
                                className="font-semibold text-purple-400 hover:text-purple-300 transition-colors text-lg"
                              >
                                @{entry.username}
                              </a>
                              <div className="text-sm text-gray-400 mt-1">
                                Ratio'd <span className="text-purple-400 font-bold">{entry.ratioCount}</span> user{entry.ratioCount !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm text-gray-400">Total likes earned</div>
                            <div className="text-xl font-bold text-purple-400">
                              {entry.totalLikesDealt.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-700 pt-4">
                          <div className="text-sm text-gray-400 mb-2">
                            🔥 Best ratio: <span className="text-purple-400 font-bold">{entry.bestRatio.ratio.toFixed(1)}x</span>
                          </div>
                          <div className="bg-gray-900/50 rounded p-3 mb-3">
                            <p className="text-gray-500 text-xs mb-1">Original post by @{entry.bestRatio.post.author}:</p>
                            <p className="text-gray-300 text-sm mb-2">{entry.bestRatio.post.content}</p>
                            <div className="flex items-center text-gray-500 text-xs">
                              <span className="mr-4">❤️ {entry.bestRatio.post.likes} likes</span>
                            </div>
                          </div>
                          <div className="bg-purple-900/20 rounded p-3 border border-purple-500/30">
                            <p className="text-gray-500 text-xs mb-1">💀 Their reply:</p>
                            <p className="text-gray-200 text-sm mb-2">{entry.bestRatio.reply.content}</p>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-purple-400 font-bold">❤️ {entry.bestRatio.reply.likes.toLocaleString()} likes</span>
                              <a
                                href={`https://x.com/${entry.username}/status/${entry.bestRatio.reply.id}`}
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
