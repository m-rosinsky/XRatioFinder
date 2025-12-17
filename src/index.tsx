import { serve } from "bun";
import index from "./index.html";
import { createPoller } from "./server/poller";
import { createFirehose } from "./server/firehose";
import { ratioStore } from "./server/store";

// Parse command line arguments
const args = process.argv.slice(2);
const useMockData = args.includes('--mock') || args.includes('--use-mock-data');

console.log(`🚀 Starting X Ratio Finder server${useMockData ? ' (MOCK MODE)' : ''}`);

// Create poller with mock data flag
const poller = createPoller(useMockData);

// Create firehose for real-time ratio detection
const firehose = createFirehose();

// CORS headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Add CORS headers to any response
function withCORS(response: Response): Response {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}


// Start the poller
poller.start();

// Start the firehose for real-time ratio detection (only in non-mock mode)
if (!useMockData) {
  firehose.start();
}

// If using mock data, do an immediate poll to load the data
if (useMockData) {
  poller.poll().then(() => {
    console.log("🎭 Mock data loaded successfully");
  }).catch((error) => {
    console.error("❌ Failed to load mock data:", error);
  });
}

const server = serve({
  routes: {
    // API routes
    "/api/ratios": {
      async GET(req) {
        try {
          const url = new URL(req.url);
          const limit = parseInt(url.searchParams.get('limit') || '100');
          const sortBy = url.searchParams.get('sortBy') || 'recency';
          const showOnlyBrutal = url.searchParams.get('showOnlyBrutal') === 'true';
          const showOnlyLethal = url.searchParams.get('showOnlyLethal') === 'true';
          const username = url.searchParams.get('username');
          const minLikes = parseInt(url.searchParams.get('minLikes') || '1000');

          let ratios = ratioStore.getAllRatios();

          // Filter by username if provided (exact match, case-insensitive)
          if (username && username.trim()) {
            const cleanUsername = username.trim().toLowerCase();
            ratios = ratios.filter(r =>
              r.parent.author.toLowerCase() === cleanUsername ||
              r.reply.author.toLowerCase() === cleanUsername
            );
          }

          // Filter by minimum likes on replies
          ratios = ratios.filter(r => r.reply.likes >= minLikes);

          // Apply filters
          if (showOnlyLethal) {
            ratios = ratios.filter(r => r.isLethalRatio);
          } else if (showOnlyBrutal) {
            ratios = ratios.filter(r => r.isBrutalRatio);
          }
          
          // Sort
          if (sortBy === 'brutality') {
            ratios.sort((a, b) => b.ratio - a.ratio);
          } else {
            // Default: recency (by actual post timestamp, not discovery time)
            ratios.sort((a, b) => {
              const timeA = new Date(a.parent.timestamp).getTime();
              const timeB = new Date(b.parent.timestamp).getTime();
              return timeB - timeA;
            });
          }
          
          // Limit
          ratios = ratios.slice(0, limit);
          
          return withCORS(Response.json({
            success: true,
            data: ratios,
            stats: ratioStore.getStats(),
          }));
        } catch (error) {
          console.error('API Error:', error);
          return withCORS(Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch ratios'
          }, { status: 500 }));
        }
      },
    },

    "/api/leaderboards": {
      async GET() {
        try {
          const leaderboards = ratioStore.getLeaderboards();
          return withCORS(Response.json({
            success: true,
            data: leaderboards,
          }));
        } catch (error) {
          console.error('Leaderboards API Error:', error);
          return withCORS(Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch leaderboards'
          }, { status: 500 }));
        }
      },
    },
    
    "/api/refresh": {
      async POST() {
        try {
          const result = await poller.poll();
          return withCORS(Response.json({
            success: true,
            ...result,
          }));
        } catch (error) {
          console.error('Refresh Error:', error);
          return withCORS(Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to refresh'
          }, { status: 500 }));
        }
      },
    },
    
    "/api/status": {
      async GET() {
        return withCORS(Response.json({
          success: true,
          poller: poller.getStatus(),
          firehose: firehose.getStats(),
          stats: ratioStore.getStats(),
          timestamp: Date.now(),
        }));
      },
    },

    "/api/enrich-user": {
      async POST(req) {
        try {
          const body = await req.json();
          const { username } = body;

          if (!username || typeof username !== 'string') {
            return withCORS(Response.json({
              success: false,
              error: 'Username is required'
            }, { status: 400 }));
          }

          // Clean the username (remove @ prefix if present)
          const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');

          // First check if the user exists
          console.log(`🔍 Checking if user ${cleanUsername} exists...`);
          const { getUserByUsername } = await import("./utils/x-api");
          const userExists = await getUserByUsername(cleanUsername);

          if (!userExists) {
            console.log(`⚠️  User ${cleanUsername} not found`);
            return withCORS(Response.json({
              success: false,
              error: `User @${cleanUsername} not found`
            }, { status: 404 }));
          }

          // Add to tracked users
          ratioStore.addTrackedUser(cleanUsername);

          // Filter existing ratios for this user (as victim or perpetrator)
          const allRatios = ratioStore.getAllRatios();
          const userRatios = allRatios.filter(r => 
            r.parent.author.toLowerCase() === cleanUsername || 
            r.reply.author.toLowerCase() === cleanUsername
          );

          console.log(`✅ User ${cleanUsername} tracked, found ${userRatios.length} existing ratios`);

          // If no ratios were found in existing data, remove from tracked list
          if (userRatios.length === 0) {
            ratioStore.removeTrackedUser(cleanUsername);
            console.log(`🗑️ No ratios found for ${cleanUsername}, removed from tracked users`);
          }

          return withCORS(Response.json({
            success: true,
            username: cleanUsername,
            existingRatios: userRatios.length,
            totalTrackedUsers: ratioStore.getStats().trackedUsers,
          }));

        } catch (error) {
          console.error('Enrich user error:', error);
          return withCORS(Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to track user'
          }, { status: 500 }));
        }
      },
    },

    // Catch-all for frontend
    "/*": index,
  },


  development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 X Ratio Finder server running at ${server.url}`);
console.log(`🔄 Polling X API every 5 minutes for initial data`);
console.log(`🔥 Likes firehose ${useMockData ? 'disabled (mock mode)' : 'enabled'} for real-time ratio detection`);
