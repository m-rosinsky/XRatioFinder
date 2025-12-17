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
  parentTweetId: string; // The actual tweet ID for clicking through to X
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
    parentTweetId: "1",
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
    parentTweetId: "2",
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
    parentTweetId: "3",
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
    parentTweetId: "4",
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
    parentTweetId: "5",
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
    parentTweetId: "6",
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
    parentTweetId: "7",
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
    parentTweetId: "8",
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
    <div className="relative overflow-hidden">
      {/* Original Post */}
      <div 
        className="flex gap-3 px-4 pt-4 pb-3 hover:bg-white/[0.02] transition-colors cursor-pointer overflow-hidden"
        onClick={() => handlePostClick(post.author, post.parentTweetId)}
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

          <p className="text-[17px] text-white leading-normal mt-1 whitespace-pre-wrap break-words overflow-hidden">{cleanContent(post.content)}</p>

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
          className={`flex gap-3 px-4 pt-1 pb-4 hover:bg-white/[0.02] transition-colors cursor-pointer overflow-hidden ${
            reply.isLethalRatio ? 'bg-purple-500/[0.03]' :
            reply.isBrutalRatio ? 'bg-orange-500/[0.03]' :
            ''
          }`}
          onClick={() => handlePostClick(reply.author, reply.id)}
        >
          {/* Avatar column */}
          <div className="flex flex-col items-center">
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
            </div>

            {/* Replying to indicator */}
            <div className="text-[13px] text-white/40 mb-1">
              Replying to <span className="text-blue-400">@{post.author}</span>
            </div>

            <p className="text-[17px] text-white leading-normal whitespace-pre-wrap break-words overflow-hidden">{cleanContent(reply.content)}</p>

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

// API helper with required headers (prevents casual scraping)
const apiFetch = (url: string, options: RequestInit = {}): Promise<Response> => {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'X-XRatio-Client': 'web-v1',
    },
  });
};

export function App() {
  const [activeFeed, setActiveFeed] = useState<'recents' | 'victims' | 'perpetrators' | 'usercard'>('recents');
  const [minLikes, setMinLikes] = useState(1000);
  const [sortBy, setSortBy] = useState<'recency' | 'brutality'>('recency');
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyBrutal, setShowOnlyBrutal] = useState(false);
  const [showOnlyLethal, setShowOnlyLethal] = useState(false);
  const [filterUsername, setFilterUsername] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [expandedLeaderboardEntry, setExpandedLeaderboardEntry] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError: boolean } | null>(null);
  
  // User Card lookup state
  const [userCardUsername, setUserCardUsername] = useState('');
  const [userCardLoading, setUserCardLoading] = useState(false);
  const [userCardData, setUserCardData] = useState<{
    username: string;
    displayName?: string;
    profileImage?: string;
    timesRatiod: number;
    timesRatioedOthers: number;
    worstRatio?: number;
    bestRatio?: number;
  } | null>(null);
  
  const showToast = (message: string, isError = false) => {
    setToastMessage({ text: message, isError });
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  // Generate screenshot image using Canvas (no profile image to avoid CORS)
  const generateShareImage = async (
    type: 'victim' | 'perpetrator',
    username: string,
    displayName: string,
    ratioCount: number,
    bestOrWorstRatio: number | undefined,
    action: 'copy' | 'download'
  ) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Use 3x scale for high resolution
    const scale = 3;
    const baseWidth = 600;
    const baseHeight = 280;
    
    // Set canvas size at higher resolution
    canvas.width = baseWidth * scale;
    canvas.height = baseHeight * scale;
    
    // Scale all drawing operations
    ctx.scale(scale, scale);
    
    // Colors based on type
    const accentColor = type === 'victim' ? '#ef4444' : '#a855f7';
    const borderRadius = 16;
    
    // Solid dark base background
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, baseWidth, baseHeight);
    
    // Gradient overlay on top of solid background
    const gradient = ctx.createLinearGradient(0, 0, baseWidth, baseHeight);
    gradient.addColorStop(0, type === 'victim' ? 'rgba(127, 29, 29, 0.35)' : 'rgba(88, 28, 135, 0.35)');
    gradient.addColorStop(0.5, 'rgba(13, 13, 13, 0)');
    gradient.addColorStop(1, type === 'victim' ? 'rgba(127, 29, 29, 0.2)' : 'rgba(88, 28, 135, 0.2)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, baseWidth, baseHeight);
    
    // Border with rounded corners
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(2, 2, baseWidth - 4, baseHeight - 4, borderRadius);
    ctx.stroke();
    
    // Display name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(displayName || username, 40, 60);
    
    // Handle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '18px system-ui, -apple-system, sans-serif';
    ctx.fillText(`@${username}`, 40, 90);
    
    // Main stat text
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
    const statText = type === 'victim' 
      ? `Got ratio'd ${ratioCount} times this week`
      : `Ratio'd ${ratioCount} users this week`;
    ctx.fillText(statText, 40, 150);
    
    // Best/Worst ratio
    if (bestOrWorstRatio) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '20px system-ui, -apple-system, sans-serif';
      const ratioLabel = type === 'victim' ? 'Worst ratio:' : 'Best ratio:';
      ctx.fillText(ratioLabel, 40, 190);
      ctx.fillStyle = accentColor;
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`${bestOrWorstRatio.toFixed(1)}×`, 160, 190);
    }
    
    // Footer line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 230);
    ctx.lineTo(baseWidth - 40, 230);
    ctx.stroke();
    
    // Branding
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '12px monospace';
    ctx.fillText('xratios.app', 40, 255);
    ctx.textAlign = 'right';
    ctx.fillText('Powered by the X API', baseWidth - 40, 255);
    ctx.textAlign = 'left';
    
    // Convert to blob
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/png');
    });
    
    if (!blob) {
      showToast('Failed to generate image', true);
      return;
    }
    
    if (action === 'copy') {
      // Check if we're on mobile (touch device or narrow screen)
      const isMobile = 'ontouchstart' in window || window.innerWidth < 768;
      
      if (isMobile && navigator.share && navigator.canShare) {
        // On mobile, use Web Share API (much better supported than clipboard for images)
        try {
          const file = new File([blob], `ratio-${username}.png`, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'X Ratio Card',
              text: `Check out @${username}'s ratio stats!`,
            });
            showToast('Shared successfully!');
            return;
          }
        } catch (err) {
          // User cancelled or share failed - that's ok, fall through
          if ((err as Error).name !== 'AbortError') {
            console.log('Share failed, trying clipboard...');
          } else {
            return; // User cancelled, don't show any message
          }
        }
      }
      
      // Desktop or share not available - try clipboard
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        showToast('Image copied to clipboard!');
      } catch {
        // Fallback to download
        downloadBlob(blob, username);
      }
    } else {
      downloadBlob(blob, username);
    }
  };
  
  const downloadBlob = (blob: Blob, username: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `ratio-${username}-${Date.now()}.png`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Image downloaded!');
  };

  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [victimsLeaderboard, setVictimsLeaderboard] = useState<VictimLeaderboardEntry[]>([]);
  const [perpetratorsLeaderboard, setPerpetratorsLeaderboard] = useState<PerpetratorLeaderboardEntry[]>([]);
  const [totalRatios, setTotalRatios] = useState<number>(0);
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);
  const [lastKnownCount, setLastKnownCount] = useState<number>(0);

  // Convert stored ratios to Post format, grouping multiple ratios on the same post
  const convertRatiosToPosts = (ratios: any[]): Post[] => {
    // Each ratio becomes its own separate card (flat feed)
    const posts: Post[] = [];
    const seenRatioIds = new Set<string>();
    
    for (const ratio of ratios) {
      // Use reply ID as unique identifier to avoid duplicates
      if (seenRatioIds.has(ratio.reply.id)) {
        continue;
      }
      seenRatioIds.add(ratio.reply.id);
      
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
      
      // Create a unique post for each ratio (combining parent + reply IDs)
      posts.push({
        id: `${ratio.parent.id}-${ratio.reply.id}`,
        parentTweetId: ratio.parent.id, // Store actual tweet ID for clicking through
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
    
    return posts;
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

      const response = await apiFetch(`/api/ratios?${params}`, { method: "GET" });

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
        const response = await apiFetch('/api/status', { method: 'GET' });
        if (response.ok) {
          const data = await response.json();
          if (data.totalRatios && data.totalRatios > lastKnownCount && lastKnownCount > 0) {
            setNewPostsAvailable(true);
            console.log(`📬 New posts available: ${data.totalRatios - lastKnownCount} new`);
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
      const response = await apiFetch("/api/leaderboards", { method: "GET" });

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

  // Handle clicking on usernames to filter by that user
  const handleUsernameClick = (username: string) => {
    const cleanUsername = username.trim().replace(/^@/, '');
    setFilterUsername(cleanUsername);
    // Load posts filtered by that user
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

  // Look up user card data
  const lookupUserCard = async (username: string) => {
    if (!username.trim()) return;
    
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    setUserCardLoading(true);
    setUserCardData(null);
    
    try {
      // Fetch all ratios for this user with low min likes to get all data
      // Note: We need to get stats from the leaderboards API which has accurate counts
      const [ratiosResponse, leaderboardsResponse] = await Promise.all([
        apiFetch(`/api/ratios?username=${encodeURIComponent(cleanUsername)}&minLikes=0&limit=100`, { method: 'GET' }),
        apiFetch(`/api/leaderboards`, { method: 'GET' })
      ]);
      
      const response = ratiosResponse;
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch user data');
      }
      
      const ratios = result.data;
      
      // Try to get accurate counts from leaderboards
      let leaderboardVictim: VictimLeaderboardEntry | undefined;
      let leaderboardPerpetrator: PerpetratorLeaderboardEntry | undefined;
      
      if (leaderboardsResponse.ok) {
        const leaderboardResult = await leaderboardsResponse.json();
        if (leaderboardResult.success) {
          leaderboardVictim = leaderboardResult.data.victims.find(
            (v: VictimLeaderboardEntry) => v.username.toLowerCase() === cleanUsername
          );
          leaderboardPerpetrator = leaderboardResult.data.perpetrators.find(
            (p: PerpetratorLeaderboardEntry) => p.username.toLowerCase() === cleanUsername
          );
        }
      }
      
      // Calculate stats from ratios as fallback, or use leaderboard data
      let timesRatiod = leaderboardVictim?.ratioCount ?? 0;
      let timesRatioedOthers = leaderboardPerpetrator?.ratioCount ?? 0;
      let worstRatio: number | undefined = leaderboardVictim?.worstRatio?.ratio;
      let bestRatio: number | undefined = leaderboardPerpetrator?.bestRatio?.ratio;
      let displayName: string | undefined = leaderboardVictim?.displayName ?? leaderboardPerpetrator?.displayName;
      let profileImage: string | undefined = leaderboardVictim?.profileImage ?? leaderboardPerpetrator?.profileImage;
      
      // If not found in leaderboards, calculate from ratios (capped at 100 but better than nothing)
      if (!leaderboardVictim && !leaderboardPerpetrator) {
        for (const ratio of ratios) {
          // User was ratio'd (they're the parent author)
          if (ratio.parent.author.toLowerCase() === cleanUsername) {
            timesRatiod++;
            const ratioValue = ratio.reply.likes / Math.max(1, ratio.parent.likes);
            if (!worstRatio || ratioValue > worstRatio) {
              worstRatio = ratioValue;
            }
            // Get display name and profile image from parent
            if (!displayName && ratio.parent.authorDisplayName) {
              displayName = ratio.parent.authorDisplayName;
            }
            if (!profileImage && ratio.parent.authorProfileImage) {
              profileImage = ratio.parent.authorProfileImage;
            }
          }
          
          // User ratio'd someone else (they're the reply author)
          if (ratio.reply.author.toLowerCase() === cleanUsername) {
            timesRatioedOthers++;
            const ratioValue = ratio.reply.likes / Math.max(1, ratio.parent.likes);
            if (!bestRatio || ratioValue > bestRatio) {
              bestRatio = ratioValue;
            }
            // Get display name and profile image from reply
            if (!displayName && ratio.reply.authorDisplayName) {
              displayName = ratio.reply.authorDisplayName;
            }
            if (!profileImage && ratio.reply.authorProfileImage) {
              profileImage = ratio.reply.authorProfileImage;
            }
          }
        }
      }
      
      setUserCardData({
        username: cleanUsername,
        displayName,
        profileImage,
        timesRatiod,
        timesRatioedOthers,
        worstRatio,
        bestRatio,
      });
      
    } catch (err) {
      console.error('Error looking up user:', err);
      showToast(err instanceof Error ? err.message : 'Failed to look up user', true);
    } finally {
      setUserCardLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans antialiased selection:bg-white/20 overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
          toastMessage.isError 
            ? 'bg-red-500/90 text-white' 
            : 'bg-white/90 text-black'
        }`}>
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}
      
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
                href="https://developer.x.com" 
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

      {/* Mobile Filters - Show only on mobile, collapsible */}
      <div className="md:hidden border-b border-white/10 bg-[#0A0A0A] relative z-10">
        {/* Toggle Button */}
        <button
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-mono text-white/60 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            Filters & Sort
          </span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${mobileFiltersOpen ? 'rotate-180' : ''}`}
          >
            <path d="m18 15-6-6-6 6"/>
          </svg>
        </button>
        
        {/* Collapsible Content */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${mobileFiltersOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 pb-5 pt-2 flex flex-col gap-5 border-t border-white/5">
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filterUsername.trim()) {
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
      </div>

      <div className="flex max-w-[1400px] mx-auto relative z-10 overflow-hidden">
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && filterUsername.trim()) {
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
        <main className="flex-1 min-w-0 p-4 md:p-8 pb-20 overflow-hidden">
          <div className="max-w-3xl mx-auto overflow-hidden">
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
                <button
                  onClick={() => setActiveFeed('usercard')}
                  className={`pb-3 font-mono text-sm tracking-wide uppercase transition-all relative cursor-pointer ${
                    activeFeed === 'usercard'
                      ? 'text-white font-medium'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  User Card
                  {activeFeed === 'usercard' && (
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                  )}
                </button>
              </div>
              
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-medium tracking-tight text-white">
                  {activeFeed === 'recents'
                    ? 'Live Feed'
                    : activeFeed === 'victims'
                    ? "This Week's Top Ratio Victims"
                    : activeFeed === 'perpetrators'
                    ? "This Week's Top Ratio-ers"
                    : "Generate User Card"}
                </h2>
                <p className="text-white/50 text-sm max-w-xl">
                  {activeFeed === 'recents'
                    ? 'Ratio events detected across X. Pull to refresh for the latest.'
                    : activeFeed === 'victims'
                    ? 'Users who have suffered the most devastating ratios in the past 7 days.'
                    : activeFeed === 'perpetrators'
                    ? 'The most ruthless ratio-ers on the platform in the past 7 days.'
                    : 'Look up any user and generate a shareable ratio stats card.'}
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
                <>
                  {filterUsername && (
                    <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
                      <span className="text-sm text-white/70">
                        Displaying <span className="text-white font-medium">{filteredPosts.length}</span> ratio{filteredPosts.length !== 1 ? 's' : ''} for <span className="text-white font-medium">@{filterUsername}</span>
                      </span>
                      <button
                        onClick={() => {
                          setFilterUsername('');
                          loadPosts();
                        }}
                        className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        Clear
                      </button>
                    </div>
                  )}
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
                </>
              )
            ) : activeFeed === 'victims' ? (
              // Victims Leaderboard Feed - Table Format
              <div>
                {victimsLeaderboard.length > 0 ? (
                  <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
                    {/* Table Header - Desktop only */}
                    <div className="hidden sm:grid grid-cols-[3rem_1fr_6rem_5rem_6rem_2.5rem] items-center gap-4 px-4 py-3 bg-white/5 border-b border-white/10 text-xs font-mono text-white/40 uppercase tracking-wider">
                      <div className="text-center">#</div>
                      <div>Account</div>
                      <div className="text-right">Ratios</div>
                      <div className="text-center">Worst</div>
                      <div></div>
                      <div></div>
                    </div>
                    
                    {/* Table Rows */}
                    {victimsLeaderboard.map((entry, index) => (
                      <div key={entry.username} className="border-b border-white/5 last:border-b-0">
                        <div
                          onClick={() => setExpandedLeaderboardEntry(expandedLeaderboardEntry === `victim-${entry.username}` ? null : `victim-${entry.username}`)}
                          className={`grid grid-cols-[2rem_1fr_4.5rem_2.5rem] sm:grid-cols-[3rem_1fr_6rem_5rem_6rem_2.5rem] items-center gap-2 sm:gap-4 px-2 sm:px-4 py-3 transition-colors hover:bg-white/[0.03] cursor-pointer ${
                            index === 0 ? 'bg-yellow-500/5' :
                            index === 1 ? 'bg-slate-400/5' :
                            index === 2 ? 'bg-orange-700/5' : ''
                          }`}
                        >
                        {/* Rank */}
                        <div className={`font-mono font-bold text-base sm:text-xl text-center ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-slate-400' :
                          index === 2 ? 'text-orange-700' :
                          'text-white/20'
                        }`}>
                          {index + 1}
                        </div>
                        
                        {/* Account - Profile image links to X */}
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 group/user overflow-hidden">
                          <a
                            href={`https://x.com/${entry.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex-shrink-0"
                          >
                            <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 ${
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
                                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white font-bold text-xs sm:text-sm">
                                  {entry.username[0].toUpperCase()}
                                </div>
                              )}
                            </div>
                          </a>
                          <div className="min-w-0 overflow-hidden">
                            <div className="font-medium text-white text-sm sm:text-base truncate hidden sm:block">
                              {entry.displayName || entry.username}
                            </div>
                            <div className="text-xs sm:text-sm text-white sm:text-white/40">
                              @{entry.username}
                            </div>
                          </div>
                        </div>
                        
                        {/* Ratio Count */}
                        <div className="text-right pr-1 flex-shrink-0">
                          <span className="text-red-400 font-bold text-xs sm:text-base">{entry.ratioCount}</span>
                          <span className="text-white/40 text-xs sm:text-sm ml-1 hidden sm:inline">ratios</span>
                        </div>
                        
                        {/* Worst Ratio */}
                        <div className="text-center hidden sm:block">
                          {entry.worstRatio?.ratio ? (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-mono border border-red-500/20">
                              {entry.worstRatio.ratio.toFixed(1)}×
                            </span>
                          ) : (
                            <span className="text-white/20">—</span>
                          )}
                        </div>
                        
                        {/* View Ratios Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveFeed('recents');
                            handleUsernameClick(entry.username);
                          }}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all cursor-pointer text-xs font-mono"
                          title={`View ${entry.displayName || entry.username}'s ratios in feed`}
                        >
                          <svg className="w-3.5 h-3.5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                          <span className="hidden sm:inline">View ratios</span>
                        </button>
                        
                        {/* Expand Button - Desktop only, row click works on mobile */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedLeaderboardEntry(expandedLeaderboardEntry === `victim-${entry.username}` ? null : `victim-${entry.username}`);
                          }}
                          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-md bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all cursor-pointer"
                          title="Expand for screenshot"
                        >
                          <svg className={`w-4 h-4 transition-transform ${expandedLeaderboardEntry === `victim-${entry.username}` ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6"/>
                          </svg>
                        </button>
                      </div>
                      
                      {/* Expanded Screenshot View */}
                        {expandedLeaderboardEntry === `victim-${entry.username}` && (
                          <div className="px-4 pb-4 pt-2">
                            {/* Action buttons */}
                            <div className="flex justify-end gap-2 mb-2">
                              <button
                                onClick={() => generateShareImage(
                                  'victim',
                                  entry.username,
                                  entry.displayName || entry.username,
                                  entry.ratioCount,
                                  entry.worstRatio?.ratio,
                                  'copy'
                                )}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-medium transition-all"
                                title="Share or copy image"
                              >
                                {/* Share icon on mobile, copy icon on desktop */}
                                <svg className="w-4 h-4 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                                </svg>
                                <svg className="w-4 h-4 hidden sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                                <span className="sm:hidden">Share</span>
                                <span className="hidden sm:inline">Copy</span>
                              </button>
                              <button
                                onClick={() => generateShareImage(
                                  'victim',
                                  entry.username,
                                  entry.displayName || entry.username,
                                  entry.ratioCount,
                                  entry.worstRatio?.ratio,
                                  'download'
                                )}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-medium transition-all"
                                title="Download image"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                  <polyline points="7 10 12 15 17 10"/>
                                  <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                                Download
                              </button>
                            </div>
                            
                            <div className="bg-gradient-to-br from-red-950/40 via-black to-red-950/20 border border-red-500/30 rounded-2xl p-8 shadow-[0_0_60px_rgba(239,68,68,0.15)]">
                              <div className="flex items-center gap-6">
                                {/* Large Profile Picture */}
                                <a
                                  href={`https://x.com/${entry.username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0"
                                >
                                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                                    {entry.profileImage ? (
                                      <img 
                                        src={entry.profileImage} 
                                        alt={`@${entry.username}`}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white font-bold text-2xl">
                                        {entry.username[0].toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                </a>
                                
                                {/* Stats */}
                                <div className="flex-1">
                                  <div className="text-2xl font-bold text-white mb-1">
                                    {entry.displayName || entry.username}
                                  </div>
                                  <div className="text-white/50 mb-4">@{entry.username}</div>
                                  <div className="text-3xl font-bold text-red-400 mb-2">
                                    Got ratio'd <span className="text-4xl">{entry.ratioCount}</span> times this week
                                  </div>
                                  {entry.worstRatio?.ratio && (
                                    <div className="text-lg text-white/60">
                                      Worst ratio: <span className="text-red-400 font-mono font-bold">{entry.worstRatio.ratio.toFixed(1)}×</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Branding */}
                              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                                <span className="text-xs text-white/30 font-mono">xratios.app</span>
                                <span className="text-xs text-white/30">Powered by the X API</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
            ) : activeFeed === 'perpetrators' ? (
              // Perpetrators Leaderboard Feed - Table Format
              <div>
                {perpetratorsLeaderboard.length > 0 ? (
                  <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
                    {/* Table Header - Desktop only */}
                    <div className="hidden sm:grid grid-cols-[3rem_1fr_6rem_5rem_6rem_2.5rem] items-center gap-4 px-4 py-3 bg-white/5 border-b border-white/10 text-xs font-mono text-white/40 uppercase tracking-wider">
                      <div className="text-center">#</div>
                      <div>Account</div>
                      <div className="text-right">Ratios</div>
                      <div className="text-center">Best</div>
                      <div></div>
                      <div></div>
                    </div>
                    
                    {/* Table Rows */}
                    {perpetratorsLeaderboard.map((entry, index) => (
                      <div key={entry.username} className="border-b border-white/5 last:border-b-0">
                        <div
                          onClick={() => setExpandedLeaderboardEntry(expandedLeaderboardEntry === `perpetrator-${entry.username}` ? null : `perpetrator-${entry.username}`)}
                          className={`grid grid-cols-[2rem_1fr_4.5rem_2.5rem] sm:grid-cols-[3rem_1fr_6rem_5rem_6rem_2.5rem] items-center gap-2 sm:gap-4 px-2 sm:px-4 py-3 transition-colors hover:bg-white/[0.03] cursor-pointer ${
                            index === 0 ? 'bg-yellow-500/5' :
                            index === 1 ? 'bg-slate-400/5' :
                            index === 2 ? 'bg-orange-700/5' : ''
                          }`}
                        >
                          {/* Rank */}
                          <div className={`font-mono font-bold text-base sm:text-xl text-center ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-slate-400' :
                            index === 2 ? 'text-orange-700' :
                            'text-white/20'
                          }`}>
                            {index + 1}
                          </div>
                          
                          {/* Account - Profile image links to X */}
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 group/user overflow-hidden">
                            <a
                              href={`https://x.com/${entry.username}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-shrink-0"
                            >
                              <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full overflow-hidden border-2 ${
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
                                  <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white font-bold text-xs sm:text-sm">
                                    {entry.username[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </a>
                            <div className="min-w-0 overflow-hidden">
                              <div className="font-medium text-white text-sm sm:text-base truncate hidden sm:block">
                                {entry.displayName || entry.username}
                              </div>
                              <div className="text-xs sm:text-sm text-white sm:text-white/40">
                                @{entry.username}
                              </div>
                            </div>
                          </div>
                          
                          {/* Ratio Count */}
                          <div className="text-right pr-1 flex-shrink-0">
                            <span className="text-purple-400 font-bold text-xs sm:text-base">{entry.ratioCount}</span>
                            <span className="text-white/40 text-xs sm:text-sm ml-1 hidden sm:inline">ratios</span>
                          </div>
                          
                          {/* Best Ratio */}
                          <div className="text-center hidden sm:block">
                            {entry.bestRatio?.ratio ? (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono border border-purple-500/20">
                                {entry.bestRatio.ratio.toFixed(1)}×
                              </span>
                            ) : (
                              <span className="text-white/20">—</span>
                            )}
                          </div>
                          
                          {/* View Ratios Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFeed('recents');
                              handleUsernameClick(entry.username);
                            }}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-white/5 hover:bg-purple-500/20 text-white/40 hover:text-purple-400 transition-all cursor-pointer text-xs font-mono"
                            title={`View ${entry.displayName || entry.username}'s ratios in feed`}
                          >
                            <svg className="w-3.5 h-3.5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                            <span className="hidden sm:inline">View ratios</span>
                          </button>
                          
                          {/* Expand Button - Desktop only, row click works on mobile */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedLeaderboardEntry(expandedLeaderboardEntry === `perpetrator-${entry.username}` ? null : `perpetrator-${entry.username}`);
                            }}
                            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-md bg-white/5 hover:bg-purple-500/20 text-white/40 hover:text-purple-400 transition-all cursor-pointer"
                            title="Expand for screenshot"
                          >
                            <svg className={`w-4 h-4 transition-transform ${expandedLeaderboardEntry === `perpetrator-${entry.username}` ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="m6 9 6 6 6-6"/>
                            </svg>
                          </button>
                        </div>
                        
                        {/* Expanded Screenshot View */}
                        {expandedLeaderboardEntry === `perpetrator-${entry.username}` && (
                          <div className="px-4 pb-4 pt-2">
                            {/* Action buttons */}
                            <div className="flex justify-end gap-2 mb-2">
                              <button
                                onClick={() => generateShareImage(
                                  'perpetrator',
                                  entry.username,
                                  entry.displayName || entry.username,
                                  entry.ratioCount,
                                  entry.bestRatio?.ratio,
                                  'copy'
                                )}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-medium transition-all"
                                title="Share or copy image"
                              >
                                {/* Share icon on mobile, copy icon on desktop */}
                                <svg className="w-4 h-4 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                                </svg>
                                <svg className="w-4 h-4 hidden sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                                <span className="sm:hidden">Share</span>
                                <span className="hidden sm:inline">Copy</span>
                              </button>
                              <button
                                onClick={() => generateShareImage(
                                  'perpetrator',
                                  entry.username,
                                  entry.displayName || entry.username,
                                  entry.ratioCount,
                                  entry.bestRatio?.ratio,
                                  'download'
                                )}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-medium transition-all"
                                title="Download image"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                  <polyline points="7 10 12 15 17 10"/>
                                  <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                                Download
                              </button>
                            </div>
                            
                            <div className="bg-gradient-to-br from-purple-950/40 via-black to-purple-950/20 border border-purple-500/30 rounded-2xl p-8 shadow-[0_0_60px_rgba(168,85,247,0.15)]">
                              <div className="flex items-center gap-6">
                                {/* Large Profile Picture */}
                                <a
                                  href={`https://x.com/${entry.username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0"
                                >
                                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                                    {entry.profileImage ? (
                                      <img 
                                        src={entry.profileImage} 
                                        alt={`@${entry.username}`}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white font-bold text-2xl">
                                        {entry.username[0].toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                </a>
                                
                                {/* Stats */}
                                <div className="flex-1">
                                  <div className="text-2xl font-bold text-white mb-1">
                                    {entry.displayName || entry.username}
                                  </div>
                                  <div className="text-white/50 mb-4">@{entry.username}</div>
                                  <div className="text-3xl font-bold text-purple-400 mb-2">
                                    Ratio'd <span className="text-4xl">{entry.ratioCount}</span> users this week
                                  </div>
                                  {entry.bestRatio?.ratio && (
                                    <div className="text-lg text-white/60">
                                      Best ratio: <span className="text-purple-400 font-mono font-bold">{entry.bestRatio.ratio.toFixed(1)}×</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* Branding */}
                              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                                <span className="text-xs text-white/30 font-mono">xratios.app</span>
                                <span className="text-xs text-white/30">Powered by the X API</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
              // User Card Lookup Pane
              <div className="space-y-6">
                {/* Search Input */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
                  <label className="block text-sm font-medium text-white/80 mb-3">
                    Enter X Username
                  </label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-white/40 text-lg">@</span>
                      </div>
                      <input
                        type="text"
                        value={userCardUsername}
                        onChange={(e) => setUserCardUsername(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && userCardUsername.trim()) {
                            lookupUserCard(userCardUsername);
                          }
                        }}
                        placeholder="username"
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-base"
                        disabled={userCardLoading}
                      />
                    </div>
                    <button
                      onClick={() => lookupUserCard(userCardUsername)}
                      disabled={userCardLoading || !userCardUsername.trim()}
                      className="px-6 py-3 bg-white hover:bg-white/90 disabled:bg-white/30 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-all flex items-center gap-2"
                    >
                      {userCardLoading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Looking up...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                          </svg>
                          Look Up
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* User Card Result */}
                {userCardData && (
                  <div className="space-y-4">
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => generateShareImage(
                          userCardData.timesRatioedOthers > userCardData.timesRatiod ? 'perpetrator' : 'victim',
                          userCardData.username,
                          userCardData.displayName || userCardData.username,
                          userCardData.timesRatioedOthers > userCardData.timesRatiod ? userCardData.timesRatioedOthers : userCardData.timesRatiod,
                          userCardData.timesRatioedOthers > userCardData.timesRatiod ? userCardData.bestRatio : userCardData.worstRatio,
                          'copy'
                        )}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm font-medium transition-all"
                        title="Share or copy image"
                      >
                        <svg className="w-4 h-4 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                        </svg>
                        <svg className="w-4 h-4 hidden sm:block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        <span className="sm:hidden">Share</span>
                        <span className="hidden sm:inline">Copy Image</span>
                      </button>
                      <button
                        onClick={() => generateShareImage(
                          userCardData.timesRatioedOthers > userCardData.timesRatiod ? 'perpetrator' : 'victim',
                          userCardData.username,
                          userCardData.displayName || userCardData.username,
                          userCardData.timesRatioedOthers > userCardData.timesRatiod ? userCardData.timesRatioedOthers : userCardData.timesRatiod,
                          userCardData.timesRatioedOthers > userCardData.timesRatiod ? userCardData.bestRatio : userCardData.worstRatio,
                          'download'
                        )}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-sm font-medium transition-all"
                        title="Download image"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Download
                      </button>
                    </div>

                    {/* The Card */}
                    <div className={`border rounded-2xl p-6 sm:p-8 shadow-[0_0_60px_rgba(168,85,247,0.1)] ${
                      userCardData.timesRatioedOthers > userCardData.timesRatiod
                        ? 'bg-gradient-to-br from-purple-950/40 via-black to-purple-950/20 border-purple-500/30'
                        : 'bg-gradient-to-br from-red-950/40 via-black to-red-950/20 border-red-500/30'
                    }`}>
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        {/* Profile Picture */}
                        <a
                          href={`https://x.com/${userCardData.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0"
                        >
                          <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 ${
                            userCardData.timesRatioedOthers > userCardData.timesRatiod
                              ? 'border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.3)]'
                              : 'border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
                          }`}>
                            {userCardData.profileImage ? (
                              <img 
                                src={userCardData.profileImage} 
                                alt={`@${userCardData.username}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white font-bold text-3xl">
                                {userCardData.username[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                        </a>
                        
                        {/* Stats */}
                        <div className="flex-1 text-center sm:text-left">
                          <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                            {userCardData.displayName || userCardData.username}
                          </div>
                          <div className="text-white/50 mb-4">@{userCardData.username}</div>
                          
                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                              <div className="text-2xl sm:text-3xl font-bold text-red-400">{userCardData.timesRatiod}</div>
                              <div className="text-xs text-white/50">times ratio'd</div>
                            </div>
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-center">
                              <div className="text-2xl sm:text-3xl font-bold text-purple-400">{userCardData.timesRatioedOthers}</div>
                              <div className="text-xs text-white/50">ratios delivered</div>
                            </div>
                          </div>
                          
                          {/* Best/Worst Ratios */}
                          <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm">
                            {userCardData.worstRatio && (
                              <div className="text-white/60">
                                Worst received: <span className="text-red-400 font-mono font-bold">{userCardData.worstRatio.toFixed(1)}×</span>
                              </div>
                            )}
                            {userCardData.bestRatio && (
                              <div className="text-white/60">
                                Best delivered: <span className="text-purple-400 font-mono font-bold">{userCardData.bestRatio.toFixed(1)}×</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* No data message */}
                      {userCardData.timesRatiod === 0 && userCardData.timesRatioedOthers === 0 && (
                        <div className="mt-6 pt-4 border-t border-white/10 text-center">
                          <p className="text-white/40 text-sm">No ratio events found for this user in our database.</p>
                        </div>
                      )}
                      
                      {/* Branding */}
                      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs text-white/30 font-mono">xratios.app</span>
                        <span className="text-xs text-white/30">Powered by the X API</span>
                      </div>
                    </div>

                    {/* View in Feed Button */}
                    {(userCardData.timesRatiod > 0 || userCardData.timesRatioedOthers > 0) && (
                      <button
                        onClick={() => {
                          setActiveFeed('recents');
                          handleUsernameClick(userCardData.username);
                        }}
                        className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70 hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                        View all ratios in feed
                      </button>
                    )}
                  </div>
                )}

                {/* Empty State */}
                {!userCardData && !userCardLoading && (
                  <div className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                    <div className="text-5xl mb-4 opacity-40">🔍</div>
                    <h3 className="text-lg font-medium text-white mb-2">Look Up Any User</h3>
                    <p className="text-white/40 max-w-sm mx-auto">
                      Enter a username above to see their ratio stats and generate a shareable card.
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
