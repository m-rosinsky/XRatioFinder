import "./index.css";
import React, { useState, useEffect, useCallback } from "react";

// Inline SVG components
const HeartIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g id="SVGRepo_bgCarrier" strokeWidth="0"/>
    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"/>
    <g id="SVGRepo_iconCarrier">
      <path d="M4.03553 1C1.80677 1 0 2.80677 0 5.03553C0 6.10582 0.42517 7.13228 1.18198 7.88909L7.14645 13.8536C7.34171 14.0488 7.65829 14.0488 7.85355 13.8536L13.818 7.88909C14.5748 7.13228 15 6.10582 15 5.03553C15 2.80677 13.1932 1 10.9645 1C9.89418 1 8.86772 1.42517 8.11091 2.18198L7.5 2.79289L6.88909 2.18198C6.13228 1.42517 5.10582 1 4.03553 1Z" fill="#e13737"/>
    </g>
  </svg>
);


// Image data with dimensions for correct aspect ratio
interface ImageData {
  url: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
}

// Type for our post data structure
interface Post {
  id: string;
  author: string;
  authorDisplayName?: string;
  authorProfileImage?: string;
  content: string;
  likes: number;
  timestamp: string;
  replies: Reply[];
  images?: ImageData[];
}

interface Reply {
  id: string;
  author: string;
  authorDisplayName?: string;
  authorProfileImage?: string;
  content: string;
  likes: number;
  isRatio: boolean;
  isBrutalRatio: boolean;
  isLethalRatio: boolean;
  images?: ImageData[];
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

// Helper function to clean content by removing t.co links, leading @mentions, and decoding HTML entities
const cleanContent = (content: string): string => {
  let cleaned = content;
  
  // Decode HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ');
  
  // Remove leading @mentions (like X does for replies)
  // This matches one or more @username patterns at the start of the text
  cleaned = cleaned.replace(/^(@[\w]+\s*)+/, '');
  
  // Remove https://t.co links (Twitter's URL shortener)
  cleaned = cleaned.replace(/https:\/\/t\.co\/\w+/g, '');
  
  return cleaned.trim();
};

// Mock data for demonstration - used as fallback
const mockPosts: Post[] = [
  // LETHAL RATIO (100x+) - Purple glow
  {
    id: "1",
    author: "tech_ceo",
    authorDisplayName: "Tech CEO",
    content: "We're pivoting to AI. Our new chatbot will revolutionize how people interact with technology. This is the future!",
    likes: 1200,
    timestamp: "2024-12-05T14:30:00Z",
    replies: [
      {
        id: "101",
        author: "senior_engineer",
        authorDisplayName: "Senior Engineer",
        content: "I worked there for 3 years. They couldn't even get the coffee machine to work properly. Good luck with AI.",
        likes: 185000,
        isRatio: true,
        isBrutalRatio: true,
        isLethalRatio: true
      }
    ]
  },
  // BRUTAL RATIO (10x-100x) - Orange glow
  {
    id: "2",
    author: "fitness_guru",
    authorDisplayName: "Fitness Guru",
    content: "Lost 50lbs in 3 months with this ONE weird trick! No exercise needed!",
    likes: 5200,
    timestamp: "2024-12-05T13:15:00Z",
    replies: [
      {
        id: "201",
        author: "actual_doctor",
        authorDisplayName: "Dr. Sarah Chen, MD",
        content: "I'm a licensed physician. This is dangerous misinformation. Weight loss requires sustainable diet changes and exercise. Please stop.",
        likes: 78000,
        isRatio: true,
        isBrutalRatio: true,
        isLethalRatio: false
      }
    ]
  },
  // BRUTAL RATIO (10x-100x) - Orange glow
  {
    id: "3",
    author: "influencer_pro",
    authorDisplayName: "Lifestyle Influencer",
    content: "Just dropped my new single! Stream it now. I put my heart and soul into this one.",
    likes: 3800,
    timestamp: "2024-12-05T12:45:00Z",
    replies: [
      {
        id: "301",
        author: "music_producer",
        authorDisplayName: "Grammy-Winning Producer",
        content: "I've been producing for 20 years. This is auto-tune over a stock beat. At least try to write your own lyrics.",
        likes: 42000,
        isRatio: true,
        isBrutalRatio: true,
        isLethalRatio: false
      }
    ]
  },
  // NORMAL RATIO (2x-10x) - Muted slate
  {
    id: "4",
    author: "design_master",
    authorDisplayName: "Design Master",
    content: "Flat design is officially dead. Brutalism is the future of UI design.",
    likes: 4500,
    timestamp: "2024-12-05T11:20:00Z",
    replies: [
      {
        id: "401",
        author: "ux_researcher",
        authorDisplayName: "UX Researcher",
        content: "Brutalism has been around since the 90s. Also, flat design isn't dead - Apple just updated their icons last month.",
        likes: 12500,
        isRatio: true,
        isBrutalRatio: false,
        isLethalRatio: false
      }
    ]
  },
  // NORMAL RATIO (2x-10x) - Muted slate
  {
    id: "5",
    author: "startup_founder",
    authorDisplayName: "Startup Founder",
    content: "We just raised $50M Series B! Excited to scale our revolutionary platform to new heights!",
    likes: 8200,
    timestamp: "2024-12-05T10:10:00Z",
    replies: [
      {
        id: "501",
        author: "vc_analyst",
        authorDisplayName: "VC Analyst",
        content: "Your company has -$2M annual revenue and 12 employees. That's a $4M valuation per head. Care to explain the math?",
        likes: 24000,
        isRatio: true,
        isBrutalRatio: false,
        isLethalRatio: false
      }
    ]
  },
  // NO RATIO - Normal post
  {
    id: "6",
    author: "crypto_trader",
    authorDisplayName: "Crypto Day Trader",
    content: "This coin is going to 1000x! Buy now before it's too late! Not financial advice.",
    likes: 6800,
    timestamp: "2024-12-05T09:30:00Z",
    replies: [
      {
        id: "601",
        author: "bear_market",
        authorDisplayName: "Market Skeptic",
        content: "This looks like a classic pump and dump. DYOR people.",
        likes: 2100,
        isRatio: false,
        isBrutalRatio: false,
        isLethalRatio: false
      }
    ]
  },
  // LETHAL RATIO (100x+) - Purple glow
  {
    id: "7",
    author: "politician_pro",
    authorDisplayName: "Senator Williams",
    content: "My new tax policy will save the average family $5000 per year! Vote for real change!",
    likes: 890,
    timestamp: "2024-12-05T08:45:00Z",
    replies: [
      {
        id: "701",
        author: "economist_phd",
        authorDisplayName: "Dr. James Parker, Economics PhD",
        content: "I analyzed this policy. It would actually cost the average family $2400/year and primarily benefits the top 1%. Here's my 47-page breakdown.",
        likes: 156000,
        isRatio: true,
        isBrutalRatio: true,
        isLethalRatio: true
      }
    ]
  },
  // NO RATIO - Normal post
  {
    id: "8",
    author: "celebrity_news",
    authorDisplayName: "Celebrity News Daily",
    content: "BREAKING: Major celebrity announces surprise album drop!",
    likes: 12500,
    timestamp: "2024-12-05T07:15:00Z",
    replies: [
      {
        id: "801",
        author: "music_blogger",
        authorDisplayName: "Music Blogger",
        content: "Actually this was announced two weeks ago. Not really breaking news.",
        likes: 4200,
        isRatio: false,
        isLethalRatio: false,
        isBrutalRatio: false
      }
    ]
  }
];

const PostCard = ({ post, onUsernameClick }: { post: Post; onUsernameClick?: (username: string) => void }) => {
  const hasRatio = post.replies.some(reply => reply.likes > post.likes);
  const hasBrutalRatio = post.replies.some(reply => reply.likes >= post.likes * 10);
  const hasLethalRatio = post.replies.some(reply => reply.likes >= post.likes * 100);
  // Sort replies by likes descending (highest ratio first)
  const sortedReplies = [...post.replies].sort((a, b) => b.likes - a.likes);

  const handlePostClick = (author: string, tweetId: string) => {
    window.open(`https://x.com/${author}/status/${tweetId}`, '_blank');
  };

  return (
    <div className="relative">
      {/* Original Post */}
      <div 
        className="flex gap-3 px-4 pt-4 pb-3 hover:bg-white/[0.02] transition-colors cursor-pointer"
        onClick={() => handlePostClick(post.author, post.id)}
      >
        {/* Avatar column with thread line */}
        <div className="flex flex-col items-center">
          <a
            href={`https://x.com/${post.author}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 transition-opacity hover:opacity-80"
            title={`@${post.author}'s profile`}
            onClick={(e) => e.stopPropagation()}
          >
            {post.authorProfileImage ? (
              <img 
                src={post.authorProfileImage} 
                alt={`@${post.author}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-800 text-white font-medium text-sm">
                {post.author[0].toUpperCase()}
              </div>
            )}
          </a>
          {/* Thread line connecting to replies */}
          {sortedReplies.length > 0 && (
            <div className="w-0.5 flex-1 mt-1 bg-white/20 min-h-[20px]"></div>
          )}
        </div>
        
        {/* Content column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap min-w-0">
            <button
              onClick={(e) => { e.stopPropagation(); onUsernameClick?.(post.author); }}
              className="font-bold text-[15px] text-white hover:underline truncate"
            >
              {post.authorDisplayName || post.author}
            </button>
            <span className="text-[15px] text-white/50 truncate">@{post.author}</span>
            <span className="text-white/30">·</span>
            <span className="text-[15px] text-white/50">{formatRelativeTime(post.timestamp)}</span>
          </div>

          <p className="text-[17px] text-white leading-normal mt-1 whitespace-pre-wrap break-words">{cleanContent(post.content)}</p>

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className="mt-3">
              <div className={`grid gap-0.5 rounded-2xl overflow-hidden border border-white/10 ${
                post.images.length === 1 ? 'grid-cols-1' :
                post.images.length === 2 ? 'grid-cols-2' :
                'grid-cols-2'
              }`}>
                {post.images.slice(0, 4).map((image, index) => (
                  <div
                    key={index}
                    className={`relative overflow-hidden ${
                      post.images!.length === 3 && index === 0 ? 'row-span-2' : ''
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                      style={{
                        aspectRatio: image.aspectRatio || (
                          post.images!.length === 1 ? 16/9 :
                          post.images!.length === 2 ? 1 :
                          post.images!.length === 3 && index === 0 ? 0.5 :
                          1
                        )
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Engagement stats */}
          <div className="flex items-center gap-4 mt-3 text-[13px] text-white/50">
            <div className="flex items-center gap-1.5">
              <HeartIcon className="w-4 h-4" />
              <span>{post.likes.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reply Posts - render all ratio replies */}
      {sortedReplies.map((reply, replyIndex) => (
        <div 
          key={reply.id}
          className={`flex gap-3 px-4 pt-1 pb-4 hover:bg-white/[0.02] transition-colors cursor-pointer ${
            reply.isLethalRatio ? 'bg-purple-500/[0.03]' :
            reply.isBrutalRatio ? 'bg-orange-500/[0.03]' :
            ''
          }`}
          onClick={() => handlePostClick(reply.author, reply.id)}
        >
          {/* Avatar column with connecting line for multiple replies */}
          <div className="flex flex-col items-center">
            {/* Thread line from previous reply */}
            {replyIndex > 0 && (
              <div className="w-0.5 h-2 bg-white/20 -mt-1 mb-1"></div>
            )}
            <a
              href={`https://x.com/${reply.author}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 transition-opacity hover:opacity-80"
              title={`@${reply.author}'s profile`}
              onClick={(e) => e.stopPropagation()}
            >
              {reply.authorProfileImage ? (
                <img 
                  src={reply.authorProfileImage} 
                  alt={`@${reply.author}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-600 to-gray-800 text-white font-medium text-sm">
                  {reply.author[0].toUpperCase()}
                </div>
              )}
            </a>
            {/* Thread line to next reply */}
            {replyIndex < sortedReplies.length - 1 && (
              <div className="w-0.5 flex-1 mt-1 bg-white/20 min-h-[20px]"></div>
            )}
          </div>
          
          {/* Content column */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap min-w-0">
              <button
                onClick={(e) => { e.stopPropagation(); onUsernameClick?.(reply.author); }}
                className="font-bold text-[15px] text-white hover:underline truncate"
              >
                {reply.authorDisplayName || reply.author}
              </button>
              <span className="text-[15px] text-white/50 truncate">@{reply.author}</span>
              {/* Ratio tier badge */}
              {reply.isLethalRatio && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-purple-500/25 text-purple-300 border border-purple-500/40">
                  💀 Lethal
                </span>
              )}
              {reply.isBrutalRatio && !reply.isLethalRatio && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-orange-500/25 text-orange-300 border border-orange-500/40">
                  🔥 Brutal
                </span>
              )}
              {/* Multiple ratio indicator */}
              {sortedReplies.length > 1 && (
                <span className="ml-1 text-[10px] text-white/40">
                  ({replyIndex + 1}/{sortedReplies.length})
                </span>
              )}
            </div>

            {/* Replying to indicator */}
            <div className="text-[13px] text-white/40 mb-1">
              Replying to <span className="text-blue-400">@{post.author}</span>
            </div>

            <p className="text-[17px] text-white leading-normal whitespace-pre-wrap break-words">{cleanContent(reply.content)}</p>

            {/* Reply Images */}
            {reply.images && reply.images.length > 0 && (
              <div className="mt-3">
                <div className={`grid gap-0.5 rounded-2xl overflow-hidden border border-white/10 ${
                  reply.images.length === 1 ? 'grid-cols-1' :
                  reply.images.length === 2 ? 'grid-cols-2' :
                  'grid-cols-2'
                }`}>
                  {reply.images.slice(0, 4).map((image, index) => (
                    <div
                      key={index}
                      className={`relative overflow-hidden ${
                        reply.images!.length === 3 && index === 0 ? 'row-span-2' : ''
                      }`}
                    >
                      <img
                        src={image.url}
                        alt={`Reply image ${index + 1}`}
                        className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                        style={{
                          aspectRatio: image.aspectRatio || (
                            reply.images!.length === 1 ? 16/9 :
                            reply.images!.length === 2 ? 4/3 :
                            reply.images!.length === 3 && index === 0 ? 0.75 :
                            1
                          )
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Engagement stats with ratio indicator */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-4 text-[13px] text-white/50">
                <div className="flex items-center gap-1.5">
                  <HeartIcon className="w-4 h-4" />
                  <span>{reply.likes.toLocaleString()}</span>
                </div>
              </div>
              
              {reply.likes > post.likes && (
                <div 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
                    reply.isLethalRatio 
                      ? 'bg-purple-500/15 text-purple-300' 
                      : reply.isBrutalRatio 
                        ? 'bg-orange-500/15 text-orange-300' 
                        : 'bg-white/10 text-white/50'
                  }`}
                  style={{
                    boxShadow: reply.isLethalRatio 
                      ? '0 0 20px 4px rgba(168, 85, 247, 0.6), 0 0 40px 8px rgba(168, 85, 247, 0.3)' 
                      : reply.isBrutalRatio 
                        ? '0 0 18px 4px rgba(249, 115, 22, 0.55), 0 0 35px 8px rgba(249, 115, 22, 0.25)' 
                        : 'none'
                  }}
                >
                  {reply.isLethalRatio && <span>💀</span>}
                  {reply.isBrutalRatio && !reply.isLethalRatio && <span>🔥</span>}
                  <span>{(reply.likes / Math.max(1, post.likes)).toFixed(1)}x ratio</span>
                </div>
              )}
            </div>

          </div>
        </div>
      ))}
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


  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [victimsLeaderboard, setVictimsLeaderboard] = useState<VictimLeaderboardEntry[]>([]);
  const [perpetratorsLeaderboard, setPerpetratorsLeaderboard] = useState<PerpetratorLeaderboardEntry[]>([]);
  const [totalRatios, setTotalRatios] = useState<number>(0);
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);
  const [lastKnownCount, setLastKnownCount] = useState<number>(0);

  // Convert stored ratios to Post format, grouping multiple ratios on the same post
  const convertRatiosToPosts = (ratios: any[]): Post[] => {
    // Group ratios by parent post id
    const postMap = new Map<string, Post>();
    
    for (const ratio of ratios) {
      const parentId = ratio.parent.id;
      const reply: Reply = {
        id: ratio.reply.id,
        author: ratio.reply.author,
        authorDisplayName: ratio.reply.authorDisplayName,
        authorProfileImage: ratio.reply.authorProfileImage,
        content: ratio.reply.content,
        likes: ratio.reply.likes,
        images: ratio.reply.images,
        isRatio: ratio.isRatio,
        isBrutalRatio: ratio.isBrutalRatio,
        isLethalRatio: ratio.isLethalRatio || false
      };
      
      if (postMap.has(parentId)) {
        // Add reply to existing post (avoid duplicates)
        const existingPost = postMap.get(parentId)!;
        if (!existingPost.replies.some(r => r.id === reply.id)) {
          existingPost.replies.push(reply);
          // Sort replies by likes (highest first)
          existingPost.replies.sort((a, b) => b.likes - a.likes);
        }
      } else {
        // Create new post entry
        postMap.set(parentId, {
          id: parentId,
          author: ratio.parent.author,
          authorDisplayName: ratio.parent.authorDisplayName,
          authorProfileImage: ratio.parent.authorProfileImage,
          content: ratio.parent.content,
          likes: ratio.parent.likes,
          timestamp: ratio.parent.timestamp,
          images: ratio.parent.images,
          replies: [reply]
        });
      }
    }
    
    return Array.from(postMap.values());
  };


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

      // Convert and set the posts (grouping multiple ratios on same post)
      const convertedPosts = convertRatiosToPosts(result.data);
      setPosts(convertedPosts);
      setLastUpdate(Date.now());
      setNewPostsAvailable(false);
      
      // Update total ratios count from stats
      if (result.stats && result.stats.total) {
        setTotalRatios(result.stats.total);
        setLastKnownCount(result.stats.total);
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
    console.log(`🔄 Filter state changed, auto-refreshing with current filters`);
    loadPosts(filterUsername || undefined);
  }, [sortBy, showOnlyBrutal, showOnlyLethal, minLikes, loadPosts]); // Added minLikes to dependencies

  // Background check for new posts (every 60 seconds)
  useEffect(() => {
    const checkForNewPosts = async () => {
      if (activeFeed !== 'recents' || loading) return;
      
      try {
        const response = await fetch('/api/status', { method: 'GET' });
        if (response.ok) {
          const data = await response.json();
          if (data.stats && data.stats.total > lastKnownCount && lastKnownCount > 0) {
            setNewPostsAvailable(true);
            console.log(`📬 New posts available: ${data.stats.total - lastKnownCount} new`);
          }
        }
      } catch (err) {
        // Silently fail - this is just a background check
      }
    };

    const interval = setInterval(checkForNewPosts, 60000); // Check every 60 seconds
    return () => clearInterval(interval);
  }, [activeFeed, loading, lastKnownCount]);

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

      // User will need to manually refresh to see newly enriched posts

    } catch (err) {
      console.error("Error enriching user:", err);
      setError(err instanceof Error ? err.message : "Failed to enrich user");
    } finally {
      setLoading(false);
    }
  };

  // Handle clicking on usernames to filter by that user
  const handleUsernameClick = async (username: string) => {
    const cleanUsername = username.trim().replace(/^@/, '');
    setFilterUsername(cleanUsername);

    // First enrich the user to ensure we have their data
    await enrichUser(cleanUsername);
    // Then load posts filtered by that user
    loadPosts(cleanUsername);
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
    displayName?: string;
    profileImage?: string;
    ratioCount: number;
    totalLikes: number;
    worstRatio: {
      ratio: number;
      postId: string;
      postContent: string;
      postLikes: number;
      postImages?: ImageData[];
      replyId: string;
      replyContent: string;
      replyLikes: number;
      replyAuthor: string;
      replyAuthorDisplayName?: string;
      replyImages?: ImageData[];
    };
  }

  interface PerpetratorLeaderboardEntry {
    username: string;
    displayName?: string;
    profileImage?: string;
    ratioCount: number;
    totalLikes: number;
    bestRatio: {
      ratio: number;
      postId: string;
      postContent: string;
      postLikes: number;
      postAuthor: string;
      postAuthorDisplayName?: string;
      postImages?: ImageData[];
      replyId: string;
      replyContent: string;
      replyLikes: number;
      replyImages?: ImageData[];
    };
  }

  // Load leaderboards when switching to leaderboard feeds
  useEffect(() => {
    if (activeFeed === 'victims' || activeFeed === 'perpetrators') {
      loadLeaderboards();
    }
  }, [activeFeed]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans antialiased selection:bg-white/20 overflow-x-hidden">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 [background:radial-gradient(100%_120%_at_50%_0%,rgba(0,0,0,0.6),transparent_60%)]"></div>
        <div className="absolute inset-0 [mask-image:radial-gradient(75%_75%_at_50%_45%,black,transparent)] [background:radial-gradient(65%_60%_at_50%_40%,rgba(255,255,255,0.02),rgba(255,255,255,0)_70%)]"></div>
      </div>

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md transition-all duration-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="cursor-pointer" onClick={() => window.location.href = '/'}>
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-white hover:fill-white/80 transition-colors">
                <g><path d="M21.742 21.75l-7.563-11.179 7.056-8.321h-2.456l-5.691 6.714-4.54-6.714H2.359l7.29 10.776L2.25 21.75h2.456l6.035-7.118 4.818 7.118h6.191-.008zM7.739 3.818L18.81 20.182h-2.447L5.29 3.818h2.447z"></path></g>
              </svg>
            </div>
            <div className="flex flex-col">
              <span 
                className="font-mono text-xs sm:text-sm tracking-widest uppercase text-white/90 hover:text-white transition-colors cursor-pointer leading-tight"
                onClick={() => window.location.href = '/'}
              >
                Ratio Finder
              </span>
              <a 
                href="https://console.x.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 text-[9px] sm:text-[10px] text-white/50 hover:text-white/80 transition-colors leading-tight"
              >
                Powered by the X API
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-2 h-2 sm:w-2.5 sm:h-2.5">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
          </div>

        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16"></div>

      {/* Mobile Filters - Show only on mobile */}
      <div className="md:hidden border-b border-white/10 bg-[#0A0A0A] px-4 py-5 relative z-10">
        <div className="flex flex-col gap-5">
          {/* Mobile Refresh Button */}
          <button
            onClick={() => loadPosts(filterUsername || undefined)}
            disabled={loading}
            className="w-full bg-white hover:bg-white/90 disabled:bg-white/50 disabled:cursor-not-allowed px-4 py-3 rounded-lg text-sm font-mono uppercase tracking-wider text-black transition-colors min-h-[44px]"
          >
            {loading ? 'Loading...' : 'Refresh View'}
          </button>

          {/* Sort */}
          <div>
            <h3 className="text-xs font-mono tracking-widest text-white/50 uppercase mb-3 flex items-center gap-2">
              [<span>Sort</span>]
            </h3>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'recency' | 'brutality')}
                className="w-full appearance-none px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30 cursor-pointer"
              >
                <option value="recency">Most Recent</option>
                <option value="brutality">Most Brutal</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-white/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div>
            <h3 className="text-xs font-mono tracking-widest text-white/50 uppercase mb-3 flex items-center gap-2">
              [<span>Filters</span>]
            </h3>
            
            {/* Min Likes Slider */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm text-white/80">Min. Reply Likes</label>
                <span className="font-mono text-xs text-[#00BA7C]">{minLikes.toLocaleString()}</span>
              </div>
              <div className="relative py-2">
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="100"
                  value={minLikes}
                  onChange={(e) => setMinLikes(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer slider accent-white"
                />
                <div className="flex justify-between text-[10px] font-mono text-white/30 mt-2">
                  <span>1K</span>
                  <span>10K</span>
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer group min-h-[44px]">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${showOnlyLethal ? 'bg-white border-white' : 'bg-transparent border-white/30 group-hover:border-white/50'}`}>
                  {showOnlyLethal && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={showOnlyLethal}
                  onChange={(e) => {
                    setShowOnlyLethal(e.target.checked);
                    if (e.target.checked) setShowOnlyBrutal(false);
                  }}
                />
                <span className="ml-3 text-sm text-white/70 group-hover:text-white transition-colors">Lethal ratios only (100x+)</span>
              </label>
              
              <label className="flex items-center cursor-pointer group min-h-[44px]">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${showOnlyBrutal ? 'bg-white border-white' : 'bg-transparent border-white/30 group-hover:border-white/50'}`}>
                  {showOnlyBrutal && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={showOnlyBrutal}
                  onChange={(e) => {
                    setShowOnlyBrutal(e.target.checked);
                    if (e.target.checked) setShowOnlyLethal(false);
                  }}
                />
                <span className="ml-3 text-sm text-white/70 group-hover:text-white transition-colors">Brutal ratios only (10x+)</span>
              </label>
            </div>
          </div>

          {/* User Filter */}
          <div className="pt-2 border-t border-white/5">
            <label className="block text-sm text-white/80 mb-3">
              Track Specific User
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-white/30">@</span>
              </div>
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
                placeholder="username"
                className="w-full pl-8 pr-3 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm min-h-[44px]"
                disabled={loading}
              />
            </div>
            {filterUsername && (
              <button
                onClick={() => {
                  setFilterUsername('');
                  loadPosts();
                }}
                className="mt-2 text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1"
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Clear filter
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex max-w-[1400px] mx-auto relative z-10">
        {/* Sidebar - Hidden on mobile */}
        <aside className="hidden md:block w-80 border-r border-white/10 p-6 min-h-[calc(100vh-4rem)] sticky top-16">
          {/* Refresh Button */}
          <button
            onClick={() => loadPosts(filterUsername || undefined)}
            disabled={loading}
            className="w-full group relative inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition-all hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed mb-8 shadow-[0_0_15px_rgba(255,255,255,0.15)] hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking X...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Refresh Feed
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw transition-transform group-hover:rotate-180"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
              </span>
            )}
          </button>

          <div className="space-y-8">
            <div>
              <h3 className="text-xs font-mono tracking-widest text-white/50 uppercase mb-4 flex items-center gap-2">
                [<span>Sort Order</span>]
              </h3>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recency' | 'brutality')}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all hover:border-white/20 cursor-pointer"
                >
                  <option value="recency" className="bg-[#161616]">Most Recent First</option>
                  <option value="brutality" className="bg-[#161616]">Highest Ratio Impact</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-mono tracking-widest text-white/50 uppercase mb-4 flex items-center gap-2">
                [<span>Filters</span>]
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm text-white/80">Min. Reply Likes</label>
                    <span className="font-mono text-xs text-[#00BA7C]">{minLikes.toLocaleString()}</span>
                  </div>
                  
                  <div className="relative py-2">
                    <input
                      type="range"
                      min="1000"
                      max="10000"
                      step="100"
                      value={minLikes}
                      onChange={(e) => setMinLikes(Number(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer slider accent-white"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-white/30 mt-2">
                      <span>1K</span>
                      <span>10K</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showOnlyLethal ? 'bg-white border-white' : 'bg-transparent border-white/30 group-hover:border-white/50'}`}>
                      {showOnlyLethal && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={showOnlyLethal}
                      onChange={(e) => {
                        setShowOnlyLethal(e.target.checked);
                        if (e.target.checked) setShowOnlyBrutal(false);
                      }}
                    />
                    <span className="ml-3 text-sm text-white/70 group-hover:text-white transition-colors">Lethal ratios only (100x+)</span>
                  </label>
                  
                  <label className="flex items-center cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showOnlyBrutal ? 'bg-white border-white' : 'bg-transparent border-white/30 group-hover:border-white/50'}`}>
                      {showOnlyBrutal && <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={showOnlyBrutal}
                      onChange={(e) => {
                        setShowOnlyBrutal(e.target.checked);
                        if (e.target.checked) setShowOnlyLethal(false);
                      }}
                    />
                    <span className="ml-3 text-sm text-white/70 group-hover:text-white transition-colors">Brutal ratios only (10x+)</span>
                  </label>
                </div>

                {/* User Filter */}
                <div className="pt-2 border-t border-white/5 mt-4">
                  <label className="block text-sm text-white/80 mb-3">
                    Track Specific User
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-white/30">@</span>
                    </div>
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
                      placeholder="username"
                      className="w-full pl-8 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-sm"
                      disabled={loading}
                    />
                  </div>
                  {filterUsername && (
                    <button
                      onClick={() => {
                        setFilterUsername('');
                        loadPosts(); 
                      }}
                      className="mt-2 text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1"
                      disabled={loading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      Clear filter
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-white/10">
              <div className="bg-white/5 rounded-lg p-4 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Total Ratios</span>
                  <span className="text-xs text-[#00BA7C] flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00BA7C] animate-pulse"></div>
                    Live
                  </span>
                </div>
                <div className="text-2xl font-mono font-medium text-white">
                  {totalRatios.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 pb-20">
          <div className="max-w-3xl mx-auto">
            {/* Feed Tabs */}
            <div className="mb-8">
              <div className="flex items-center gap-6 mb-6 border-b border-white/10">
                <button
                  onClick={() => setActiveFeed('recents')}
                  className={`pb-3 font-mono text-sm tracking-wide uppercase transition-all relative cursor-pointer ${
                    activeFeed === 'recents'
                      ? 'text-white font-medium'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Feed
                  {activeFeed === 'recents' && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveFeed('victims')}
                  className={`pb-3 font-mono text-sm tracking-wide uppercase transition-all relative cursor-pointer ${
                    activeFeed === 'victims'
                      ? 'text-white font-medium'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Top Victims
                  {activeFeed === 'victims' && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveFeed('perpetrators')}
                  className={`pb-3 font-mono text-sm tracking-wide uppercase transition-all relative cursor-pointer ${
                    activeFeed === 'perpetrators'
                      ? 'text-white font-medium'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  Top Ratio-ers
                  {activeFeed === 'perpetrators' && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                  )}
                </button>
              </div>
              
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-medium tracking-tight text-white">
                  {activeFeed === 'recents'
                    ? 'Live Feed'
                    : activeFeed === 'victims'
                    ? 'Hall of Shame'
                    : 'Hall of Fame'}
                </h2>
                <p className="text-white/50 text-sm max-w-xl">
                  {activeFeed === 'recents'
                    ? 'Ratio events detected across X. Pull to refresh for the latest.'
                    : activeFeed === 'victims'
                    ? 'Users who have suffered the most devastating ratios in the past 7 days.'
                    : 'The most ruthless ratio-ers on the platform in the past 7 days.'}
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="text-red-500 mt-0.5">⚠️</div>
                  <div>
                    <p className="text-white font-medium mb-1">System Error</p>
                    <p className="text-white/60 text-sm mb-2">{error}</p>
                    <p className="text-white/40 text-xs font-mono">
                      Check BEARER_TOKEN configuration
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* New Posts Available Pill */}
            {newPostsAvailable && activeFeed === 'recents' && (
              <div className="flex justify-center mb-4">
                <button
                  onClick={() => {
                    loadPosts(filterUsername || undefined);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-full shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7"/>
                  </svg>
                  New ratios available
                </button>
              </div>
            )}

            {activeFeed === 'recents' ? (
              // Recents Feed
              loading && posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="relative w-12 h-12 mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-white/10"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  </div>
                  <p className="text-white/60 font-mono text-sm animate-pulse">Scanning network for ratios...</p>
                </div>
              ) : (
                <div className="divide-y divide-white/20 border-y border-white/20">
                  {filteredPosts.length > 0 ? (
                    filteredPosts.map(post => (
                      <PostCard key={post.id} post={post} onUsernameClick={handleUsernameClick} />
                    ))
                  ) : (
                    <div className="text-center py-20">
                      <p className="text-white/40 font-mono text-sm">No ratios detected with current filters.</p>
                    </div>
                  )}
                </div>
              )
            ) : activeFeed === 'victims' ? (
              // Victims Leaderboard Feed
              <div className="space-y-4">
                {victimsLeaderboard.length > 0 ? (
                  <>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4 flex items-center justify-between text-sm text-white/60 font-mono">
                      <span>Top {victimsLeaderboard.length} Victims</span>
                      <span>Based on {totalRatios} total ratios</span>
                    </div>
                    
                    {victimsLeaderboard.map((entry, index) => (
                      <div
                        key={entry.username}
                        className={`group relative rounded-xl border transition-all p-6 ${
                          index === 0
                            ? 'border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_30px_rgba(234,179,8,0.1)]'
                            : index === 1
                            ? 'border-slate-400/50 bg-slate-400/10 shadow-[0_0_20px_rgba(148,163,184,0.1)]'
                            : index === 2
                            ? 'border-orange-700/50 bg-orange-700/10 shadow-[0_0_20px_rgba(194,65,12,0.1)]'
                            : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className={`font-mono font-bold text-2xl w-8 text-center ${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-slate-400' :
                              index === 2 ? 'text-orange-700' :
                              'text-white/20'
                            }`}>
                              {index + 1}
                            </div>

                            <a
                              href={`https://x.com/${entry.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative"
                              title={`@${entry.username}'s profile`}
                            >
                              <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${
                                index === 0 ? 'border-yellow-500' :
                                index === 1 ? 'border-slate-400' :
                                index === 2 ? 'border-orange-700' :
                                'border-white/10'
                              }`}>
                                {entry.profileImage ? (
                                  <img 
                                    src={entry.profileImage} 
                                    alt={`@${entry.username}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white font-bold">
                                    {entry.username[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                              {index < 3 && (
                                <div className="absolute -top-1 -right-1 text-lg">
                                  {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                                </div>
                              )}
                            </a>
                            
                            <div>
                              <a
                                href={`https://x.com/${entry.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-white text-lg hover:underline"
                              >
                                {entry.displayName || entry.username}
                              </a>
                              <div className="text-xs text-white/40">@{entry.username}</div>
                              <div className="text-sm text-white/40 mt-0.5">
                                Ratio'd <span className="text-red-400 font-bold">{entry.ratioCount}x</span> this week
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right hidden sm:block">
                            <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Total Damage</div>
                            <div className="text-xl font-mono font-medium text-red-400">
                              {entry.totalLikes.toLocaleString()} <span className="text-xs text-white/40">likes against</span>
                            </div>
                          </div>
                        </div>
                        
                        {entry.worstRatio?.ratio && (
                        <div className="border-t border-white/10 pt-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Worst Defeat</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-mono border border-red-500/20">
                              {entry.worstRatio.ratio.toFixed(1)}x Ratio
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-4">
                            {/* Victim's Post */}
                            <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                              <p className="text-white/60 text-sm mb-3 line-clamp-2">{cleanContent(entry.worstRatio.postContent)}</p>
                              {/* Post Images */}
                              {entry.worstRatio.postImages && entry.worstRatio.postImages.length > 0 && (
                                <div className="mb-3">
                                  <div className={`grid gap-1.5 ${
                                    entry.worstRatio.postImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                                  }`}>
                                    {entry.worstRatio.postImages.slice(0, 4).map((image, imgIndex) => (
                                      <div
                                        key={imgIndex}
                                        className={`relative overflow-hidden rounded-lg border border-white/10 ${
                                          entry.worstRatio.postImages!.length === 3 && imgIndex === 0 ? 'row-span-2' : ''
                                        }`}
                                      >
                                        <img
                                          src={image.url}
                                          alt={`Post image ${imgIndex + 1}`}
                                          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                          onClick={() => window.open(image.url, '_blank')}
                                          style={{
                                            aspectRatio: image.aspectRatio || (
                                              entry.worstRatio.postImages!.length === 1 ? 16/9 :
                                              entry.worstRatio.postImages!.length === 2 ? 4/3 :
                                              entry.worstRatio.postImages!.length === 3 && imgIndex === 0 ? 0.75 :
                                              1
                                            )
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center justify-between text-xs text-white/30">
                                <span className="flex items-center gap-1.5">
                                  <HeartIcon className="w-3 h-3" />
                                  {entry.worstRatio.postLikes?.toLocaleString()}
                                </span>
                                <a href={`https://x.com/${entry.username}/status/${entry.worstRatio.postId}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">View →</a>
                              </div>
                            </div>
                            
                            {/* The Ratio Reply with connecting line */}
                            <div className="relative sm:ml-12">
                              {/* Connection Line - positioned to connect from above */}
                              <div className="absolute left-[-1.5rem] top-[-0.5rem] bottom-0 w-0.5 bg-gradient-to-b from-white/10 to-red-500/20 hidden sm:block"></div>
                              
                              <div className="bg-red-500/5 rounded-lg p-4 border border-red-500/10 relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-red-400 font-medium">{entry.worstRatio.replyAuthorDisplayName || entry.worstRatio.replyAuthor} <span className="text-white/40">@{entry.worstRatio.replyAuthor}</span> replied:</span>
                                </div>
                                <p className="text-white/90 text-sm mb-3 line-clamp-3">{cleanContent(entry.worstRatio.replyContent)}</p>
                                {/* Reply Images */}
                                {entry.worstRatio.replyImages && entry.worstRatio.replyImages.length > 0 && (
                                  <div className="mb-3">
                                    <div className={`grid gap-1.5 ${
                                      entry.worstRatio.replyImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                                    }`}>
                                      {entry.worstRatio.replyImages.slice(0, 4).map((image, imgIndex) => (
                                        <div
                                          key={imgIndex}
                                          className={`relative overflow-hidden rounded-lg border border-white/10 ${
                                            entry.worstRatio.replyImages!.length === 3 && imgIndex === 0 ? 'row-span-2' : ''
                                          }`}
                                        >
                                          <img
                                            src={image.url}
                                            alt={`Reply image ${imgIndex + 1}`}
                                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                            onClick={() => window.open(image.url, '_blank')}
                                            style={{
                                              aspectRatio: image.aspectRatio || (
                                                entry.worstRatio.replyImages!.length === 1 ? 16/9 :
                                                entry.worstRatio.replyImages!.length === 2 ? 4/3 :
                                                entry.worstRatio.replyImages!.length === 3 && imgIndex === 0 ? 0.75 :
                                                1
                                              )
                                            }}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-1.5 text-red-400">
                                    <HeartIcon className="w-3 h-3" />
                                    {entry.worstRatio.replyLikes?.toLocaleString()}
                                  </span>
                                  <a href={`https://x.com/${entry.worstRatio.replyAuthor}/status/${entry.worstRatio.replyId}`} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors">View →</a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                    <div className="text-4xl mb-4 opacity-50">📊</div>
                    <h3 className="text-lg font-medium text-white mb-2">No Data Available</h3>
                    <p className="text-white/40 max-w-md mx-auto">
                      The leaderboard is currently empty. Wait for ratio events to be detected.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Perpetrators Leaderboard Feed
              <div className="space-y-4">
                {perpetratorsLeaderboard.length > 0 ? (
                  <>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-4 flex items-center justify-between text-sm text-white/60 font-mono">
                      <span>Top {perpetratorsLeaderboard.length} Ratio Assassins</span>
                      <span>From {totalRatios} total ratios</span>
                    </div>
                    
                    {perpetratorsLeaderboard.map((entry, index) => (
                      <div
                        key={entry.username}
                        className={`group relative rounded-xl border transition-all p-6 ${
                          index === 0
                            ? 'border-yellow-500/50 bg-yellow-500/10 shadow-[0_0_30px_rgba(234,179,8,0.1)]'
                            : index === 1
                            ? 'border-slate-400/50 bg-slate-400/10 shadow-[0_0_20px_rgba(148,163,184,0.1)]'
                            : index === 2
                            ? 'border-orange-700/50 bg-orange-700/10 shadow-[0_0_20px_rgba(194,65,12,0.1)]'
                            : 'border-white/10 bg-white/5 hover:bg-white/[0.07]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className={`font-mono font-bold text-2xl w-8 text-center ${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-slate-400' :
                              index === 2 ? 'text-orange-700' :
                              'text-white/20'
                            }`}>
                              {index + 1}
                            </div>

                            <a
                              href={`https://x.com/${entry.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative"
                              title={`@${entry.username}'s profile`}
                            >
                              <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${
                                index === 0 ? 'border-yellow-500' :
                                index === 1 ? 'border-slate-400' :
                                index === 2 ? 'border-orange-700' :
                                'border-white/10'
                              }`}>
                                {entry.profileImage ? (
                                  <img 
                                    src={entry.profileImage} 
                                    alt={`@${entry.username}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white font-bold">
                                    {entry.username[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                              {index < 3 && (
                                <div className="absolute -top-1 -right-1 text-lg">
                                  {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                                </div>
                              )}
                            </a>
                            
                            <div>
                              <a
                                href={`https://x.com/${entry.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-white text-lg hover:underline"
                              >
                                {entry.displayName || entry.username}
                              </a>
                              <div className="text-xs text-white/40">@{entry.username}</div>
                              <div className="text-sm text-white/40 mt-0.5">
                                Ratio'd <span className="text-purple-400 font-bold">{entry.ratioCount}</span> user{entry.ratioCount !== 1 ? 's' : ''} this week
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right hidden sm:block">
                            <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Total Likes Earned</div>
                            <div className="text-xl font-mono font-medium text-purple-400">
                              {entry.totalLikes.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t border-white/10 pt-4">
                          {entry.bestRatio && entry.bestRatio.ratio > 0 ? (
                            <>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-mono text-white/40 uppercase tracking-wider">Best Ratio</span>
                                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono border border-purple-500/20">
                                  {entry.bestRatio.ratio.toFixed(1)}x
                                </span>
                              </div>
                              
                              <div className="flex flex-col gap-4">
                                {/* Victim's Post */}
                                <div className="bg-black/20 rounded-lg p-4 border border-white/5">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-white/40">Original post by {entry.bestRatio.postAuthorDisplayName || entry.bestRatio.postAuthor} <span className="text-white/30">@{entry.bestRatio.postAuthor}</span>:</span>
                                  </div>
                                  <p className="text-white/60 text-sm mb-3 line-clamp-2">{cleanContent(entry.bestRatio.postContent)}</p>
                                  {/* Post Images */}
                                  {entry.bestRatio.postImages && entry.bestRatio.postImages.length > 0 && (
                                    <div className="mb-3">
                                      <div className={`grid gap-1.5 ${
                                        entry.bestRatio.postImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                                      }`}>
                                        {entry.bestRatio.postImages.slice(0, 4).map((image, imgIndex) => (
                                          <div
                                            key={imgIndex}
                                            className={`relative overflow-hidden rounded-lg border border-white/10 ${
                                              entry.bestRatio.postImages!.length === 3 && imgIndex === 0 ? 'row-span-2' : ''
                                            }`}
                                          >
                                            <img
                                              src={image.url}
                                              alt={`Post image ${imgIndex + 1}`}
                                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                              onClick={() => window.open(image.url, '_blank')}
                                              style={{
                                                aspectRatio: image.aspectRatio || (
                                                  entry.bestRatio.postImages!.length === 1 ? 16/9 :
                                                  entry.bestRatio.postImages!.length === 2 ? 4/3 :
                                                  entry.bestRatio.postImages!.length === 3 && imgIndex === 0 ? 0.75 :
                                                  1
                                                )
                                              }}
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between text-xs text-white/30">
                                    <span className="flex items-center gap-1.5">
                                      <HeartIcon className="w-3 h-3" />
                                      {entry.bestRatio.postLikes.toLocaleString()}
                                    </span>
                                    <a href={`https://x.com/${entry.bestRatio.postAuthor}/status/${entry.bestRatio.postId}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">View →</a>
                                  </div>
                                </div>

                                {/* The Killer Ratio with connecting line */}
                                <div className="relative sm:ml-12">
                                  {/* Connection Line - positioned to connect from above */}
                                  <div className="absolute left-[-1.5rem] top-[-0.5rem] bottom-0 w-0.5 bg-gradient-to-b from-white/10 to-purple-500/20 hidden sm:block"></div>
                                  
                                  <div className="bg-purple-500/5 rounded-lg p-4 border border-purple-500/10 relative z-10">
                                    <p className="text-white/90 text-sm mb-3 line-clamp-3">{cleanContent(entry.bestRatio.replyContent)}</p>
                                    {/* Reply Images */}
                                    {entry.bestRatio.replyImages && entry.bestRatio.replyImages.length > 0 && (
                                      <div className="mb-3">
                                        <div className={`grid gap-1.5 ${
                                          entry.bestRatio.replyImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                                        }`}>
                                          {entry.bestRatio.replyImages.slice(0, 4).map((image, imgIndex) => (
                                            <div
                                              key={imgIndex}
                                              className={`relative overflow-hidden rounded-lg border border-white/10 ${
                                                entry.bestRatio.replyImages!.length === 3 && imgIndex === 0 ? 'row-span-2' : ''
                                              }`}
                                            >
                                              <img
                                                src={image.url}
                                                alt={`Reply image ${imgIndex + 1}`}
                                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                                onClick={() => window.open(image.url, '_blank')}
                                                style={{
                                                  aspectRatio: image.aspectRatio || (
                                                    entry.bestRatio.replyImages!.length === 1 ? 16/9 :
                                                    entry.bestRatio.replyImages!.length === 2 ? 4/3 :
                                                    entry.bestRatio.replyImages!.length === 3 && imgIndex === 0 ? 0.75 :
                                                    1
                                                  )
                                                }}
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="flex items-center gap-1.5 text-purple-400">
                                        <HeartIcon className="w-3 h-3" />
                                        {entry.bestRatio.replyLikes.toLocaleString()}
                                      </span>
                                      <a href={`https://x.com/${entry.username}/status/${entry.bestRatio.replyId}`} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white transition-colors">View →</a>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="text-xs font-mono text-white/30 text-center py-4">
                              No ratios detected yet
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                    <div className="text-4xl mb-4 opacity-50">📊</div>
                    <h3 className="text-lg font-medium text-white mb-2">No Data Available</h3>
                    <p className="text-white/40 max-w-md mx-auto">
                      The leaderboard is currently empty. Wait for ratio events to be detected.
                    </p>
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
