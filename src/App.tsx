import "./index.css";
import { useState } from "react";

// Mock data for demonstration - adjusted to test the 500-10k likes slider
const mockPosts = [
  {
    id: 1,
    author: "techguru",
    content: "Just launched my new AI startup! 🚀 Can't wait to see what the future holds.",
    likes: 750,
    timestamp: "2024-11-07T14:30:00Z",
    replies: [
      {
        id: 101,
        author: "skeptic_dev",
        content: "AI startups are so 2023. What's your unique value prop?",
        likes: 156,
        isRatio: false,
        isBrutalRatio: false
      }
    ]
  },
  {
    id: 2,
    author: "design_master",
    content: "Flat design is dead. Time for brutalism in UI! 💀",
    likes: 1200,
    timestamp: "2024-11-07T13:15:00Z",
    replies: [
      {
        id: 201,
        author: "ux_lover",
        content: "Actually, brutalism has been around forever. It's not new.",
        likes: 2800,
        isRatio: true,
        isBrutalRatio: true
      }
    ]
  },
  {
    id: 3,
    author: "ceo_startup",
    content: "Our team just hit unicorn status! 🦄 Time to celebrate!",
    likes: 2500,
    timestamp: "2024-11-07T12:45:00Z",
    replies: [
      {
        id: 301,
        author: "finance_guru",
        content: "Unicorn? More like a donkey. Your valuation is inflated garbage.",
        likes: 150,
        isRatio: false,
        isBrutalRatio: false
      }
    ]
  },
  {
    id: 4,
    author: "influencer_pro",
    content: "Just dropped my new single! Stream it now 🎵 #NewMusic",
    likes: 3800,
    timestamp: "2024-11-07T11:20:00Z",
    replies: [
      {
        id: 401,
        author: "music_critic",
        content: "This is absolutely terrible. How do you even call yourself a musician?",
        likes: 42000,
        isRatio: true,
        isBrutalRatio: true
      }
    ]
  },
  {
    id: 5,
    author: "fitness_guru",
    content: "Lost 50lbs in 3 months with this ONE weird trick! 💪",
    likes: 5200,
    timestamp: "2024-11-07T10:10:00Z",
    replies: [
      {
        id: 501,
        author: "science_fan",
        content: "Please stop spreading misinformation. Weight loss requires diet + exercise.",
        likes: 58000,
        isRatio: true,
        isBrutalRatio: true
      }
    ]
  },
  {
    id: 6,
    author: "crypto_trader",
    content: "This coin is going to 1000x! Buy now before it's too late! 📈",
    likes: 6800,
    timestamp: "2024-11-07T09:30:00Z",
    replies: [
      {
        id: 601,
        author: "bear_market",
        content: "This is a rug pull waiting to happen. DYOR people.",
        likes: 1200,
        isRatio: false,
        isBrutalRatio: false
      }
    ]
  },
  {
    id: 7,
    author: "celebrity_news",
    content: "BREAKING: Major celebrity scandal drops! 🍿",
    likes: 8500,
    timestamp: "2024-11-07T08:45:00Z",
    replies: [
      {
        id: 701,
        author: "gossip_expert",
        content: "Old news. This was leaked weeks ago.",
        likes: 3400,
        isRatio: false,
        isBrutalRatio: false
      }
    ]
  },
  {
    id: 8,
    author: "politician_pro",
    content: "My new policy will change everything! Vote for change! 🗳️",
    likes: 9200,
    timestamp: "2024-11-07T07:15:00Z",
    replies: [
      {
        id: 801,
        author: "fact_checker",
        content: "Your facts are wrong. Here's the actual data...",
        likes: 5600,
        isRatio: false,
        isBrutalRatio: false
      }
    ]
  }
];

const PostCard = ({ post }: { post: typeof mockPosts[0] }) => {
  const hasRatio = post.replies.some(reply => reply.likes > post.likes);
  const hasBrutalRatio = post.replies.some(reply => reply.likes >= post.likes * 10);

  return (
    <div className={`bg-gray-800 rounded-lg border p-6 mb-6 ${
      hasBrutalRatio
        ? 'border-orange-500 bg-orange-900/30 shadow-lg shadow-orange-500/20'
        : hasRatio
        ? 'border-red-500 bg-red-900/20'
        : 'border-gray-700'
    }`}>
      {/* Original Post */}
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
            {post.author[0].toUpperCase()}
          </div>
          <span className="font-semibold text-blue-400">@{post.author}</span>
          {hasBrutalRatio && (
            <span className="ml-auto bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-1 rounded text-sm font-bold animate-pulse">
              💀 BRUTAL RATIO
            </span>
          )}
          {hasRatio && !hasBrutalRatio && (
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
              reply.isBrutalRatio
                ? 'border-orange-500 bg-orange-900/20 shadow-md shadow-orange-500/10'
                : reply.isRatio
                ? 'border-red-500 bg-red-900/10'
                : 'border-gray-600 bg-gray-700/50'
            }`}>
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm mr-2">
                  {reply.author[0].toUpperCase()}
                </div>
                <span className="font-semibold text-purple-400 text-sm">@{reply.author}</span>
                {reply.isBrutalRatio && (
                  <span className="ml-auto bg-gradient-to-r from-orange-500 to-red-600 text-white px-2 py-0.5 rounded text-xs font-bold animate-pulse">
                    BRUTAL!
                  </span>
                )}
                {reply.isRatio && !reply.isBrutalRatio && (
                  <span className="ml-auto bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                    RATIO!
                  </span>
                )}
              </div>
              <p className="text-gray-300 text-sm mb-2">{reply.content}</p>
              <div className="flex items-center text-gray-500 text-xs">
                <span>❤️ {reply.likes} likes</span>
                {reply.isBrutalRatio && (
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
  const [minLikes, setMinLikes] = useState(500);
  const [sortBy, setSortBy] = useState<'recency' | 'brutality'>('recency');

  const sortedPosts = [...mockPosts].sort((a, b) => {
    if (sortBy === 'recency') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else { // brutality
      const aMaxRatio = Math.max(...a.replies.map(reply => reply.likes / a.likes));
      const bMaxRatio = Math.max(...b.replies.map(reply => reply.likes / b.likes));
      return bMaxRatio - aMaxRatio;
    }
  });

  const filteredPosts = sortedPosts.filter(post => post.likes >= minLikes);

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
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Powered by the X API</span>
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
          <div className="mt-8">
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
                  Min. Original Likes: {minLikes.toLocaleString()}
                </label>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="100"
                  value={minLikes}
                  onChange={(e) => setMinLikes(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>500</span>
                  <span>10k</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input type="checkbox" defaultChecked className="mr-2" />
                  <span className="text-sm">Show only ratios</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">Show only brutal ratios</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">Hide low engagement</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span className="text-sm">Real-time updates</span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-200 mb-2">Latest Posts & Ratios</h2>
              <p className="text-gray-400 text-sm">Monitoring X for ratio opportunities in real-time</p>
            </div>

            <div className="space-y-6">
              {filteredPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
