import { serve } from "bun";
import index from "./index.html";
import { createPoller } from "./server/poller";
import { ratioStore } from "./server/store";
import { authStore } from "./server/auth-store";
import {
  getAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  postTweet,
  isOAuth2Configured,
  generateSessionId
} from "./utils/auth";

// Parse command line arguments
const args = process.argv.slice(2);
const useMockData = args.includes('--mock') || args.includes('--use-mock-data');

console.log(`🚀 Starting X Ratio Finder server${useMockData ? ' (MOCK MODE)' : ''}`);

// Create poller with mock data flag
const poller = createPoller(useMockData);

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

// WebSocket clients for broadcasting updates
const wsClients = new Set<any>();

// Broadcast to all connected WebSocket clients
function broadcastUpdate(data: any) {
  const message = JSON.stringify(data);
  for (const ws of wsClients) {
    try {
      ws.send(message);
    } catch (error) {
      console.error("Failed to send to WebSocket client:", error);
      wsClients.delete(ws);
    }
  }
}

// Start the poller with update callback
poller.start(() => {
  console.log("📡 Broadcasting update to", wsClients.size, "clients");
  broadcastUpdate({
    type: "ratios_updated",
    timestamp: Date.now(),
    stats: ratioStore.getStats(),
  });
});

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
          store: ratioStore.getStats(),
          clients: wsClients.size,
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
            console.log(`⚠️  User ${cleanUsername} not found, skipping enrichment`);
            return withCORS(Response.json({
              success: false,
              error: `User @${cleanUsername} not found`
            }, { status: 404 }));
          }

          console.log(`✅ User ${cleanUsername} found, proceeding with enrichment`);
          ratioStore.addTrackedUser(cleanUsername);

          // Import enrichment functions
          const { enrichUserRatios, enrichPerpetratorRatios } = await import("./utils/x-api");

          // Get existing ratio IDs to determine which are new
          const existingIds = new Set(ratioStore.getAllRatios().map(r => r.id));
          let totalEnriched = 0;
          let newCount = 0;

          try {
            // Enrich as potential victim (check if their posts got ratio'd)
            const victimRatios = await enrichUserRatios([cleanUsername]);
            totalEnriched += victimRatios.length;

            // Store the ratios
            for (const ratio of victimRatios) {
              const isNew = !existingIds.has(ratio.parent.id);

              const storedRatio = {
                id: ratio.parent.id,
                parent: {
                  id: ratio.parent.id,
                  author: ratio.parent.author.username,
                  authorProfileImage: ratio.parent.author.profile_image_url,
                  content: ratio.parent.text,
                  likes: ratio.parent.public_metrics.like_count,
                  timestamp: ratio.parent.created_at,
                  images: ratio.parent.images,
                },
                reply: {
                  id: ratio.reply.id,
                  author: ratio.reply.author.username,
                  authorProfileImage: ratio.reply.author.profile_image_url,
                  content: ratio.reply.text,
                  likes: ratio.reply.public_metrics.like_count,
                  images: ratio.reply.images,
                },
                ratio: ratio.ratio,
                isBrutalRatio: ratio.isBrutalRatio,
                isLethalRatio: ratio.isLethalRatio,
                isRatio: ratio.ratio > 1,
                discoveredAt: isNew ? Date.now() : (ratioStore.getAllRatios().find(r => r.id === ratio.parent.id)?.discoveredAt || Date.now()),
              };
              
              ratioStore.addRatio(storedRatio);
              
              if (isNew) {
                newCount++;
              }
            }
          } catch (error) {
            console.error(`Error enriching ${cleanUsername} as victim:`, error);
          }

          try {
            // Enrich as potential perpetrator (check their replies for ratios)
            const perpetratorRatios = await enrichPerpetratorRatios([cleanUsername]);
            totalEnriched += perpetratorRatios.length;

            // Store the ratios
            for (const ratio of perpetratorRatios) {
              const isNew = !existingIds.has(ratio.parent.id);

              const storedRatio = {
                id: ratio.parent.id,
                parent: {
                  id: ratio.parent.id,
                  author: ratio.parent.author.username,
                  authorProfileImage: ratio.parent.author.profile_image_url,
                  content: ratio.parent.text,
                  likes: ratio.parent.public_metrics.like_count,
                  timestamp: ratio.parent.created_at,
                  images: ratio.parent.images,
                },
                reply: {
                  id: ratio.reply.id,
                  author: ratio.reply.author.username,
                  authorProfileImage: ratio.reply.author.profile_image_url,
                  content: ratio.reply.text,
                  likes: ratio.reply.public_metrics.like_count,
                  images: ratio.reply.images,
                },
                ratio: ratio.ratio,
                isBrutalRatio: ratio.isBrutalRatio,
                isLethalRatio: ratio.isLethalRatio,
                isRatio: ratio.ratio > 1,
                discoveredAt: isNew ? Date.now() : (ratioStore.getAllRatios().find(r => r.id === ratio.parent.id)?.discoveredAt || Date.now()),
              };
              
              ratioStore.addRatio(storedRatio);
              
              if (isNew) {
                newCount++;
              }
            }
          } catch (error) {
            console.error(`Error enriching ${cleanUsername} as perpetrator:`, error);
          }

          console.log(`✅ Enrichment complete for ${cleanUsername}: ${newCount} new, ${totalEnriched - newCount} updated`);

          // Broadcast update to all clients
          broadcastUpdate({
            type: "ratios_updated",
            timestamp: Date.now(),
            stats: ratioStore.getStats(),
          });

          return withCORS(Response.json({
            success: true,
            username: cleanUsername,
            enrichedRatios: totalEnriched,
            totalTrackedUsers: ratioStore.getStats().trackedUsers,
          }));

        } catch (error) {
          console.error('Enrich user error:', error);
          return withCORS(Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to enrich user'
          }, { status: 500 }));
        }
      },
    },

    // Authentication routes (only if OAuth2 is configured)
    "/api/auth/login": {
      async GET() {
        if (!isOAuth2Configured()) {
          return withCORS(Response.json({
            success: false,
            error: 'OAuth2 not configured'
          }, { status: 501 }));
        }

        try {
          const authUrl = getAuthorizationUrl();
          return withCORS(Response.json({
            success: true,
            authUrl
          }));
        } catch (error) {
          console.error('Auth login error:', error);
          return withCORS(Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate auth URL'
          }, { status: 500 }));
        }
      },
    },

    "/api/auth/callback": {
      async GET(req) {
        if (!isOAuth2Configured()) {
          return withCORS(Response.redirect('/?auth=disabled', 302));
        }

        try {
          const url = new URL(req.url);
          const code = url.searchParams.get('code');
          const state = url.searchParams.get('state');
          const error = url.searchParams.get('error');

          if (error) {
            console.error('OAuth2 error:', error);
            return withCORS(Response.redirect('/?auth=error', 302));
          }

          if (!code) {
            return withCORS(Response.redirect('/?auth=no_code', 302));
          }

          // Exchange code for token
          const session = await exchangeCodeForToken(code);
          const sessionId = generateSessionId();

          // Store session
          authStore.setSession(sessionId, session);

          console.log(`✅ User authenticated: @${session.user.username}`);

          // Redirect to frontend with session ID as cookie
          const response = withCORS(Response.redirect('/?auth=success', 302));
          response.headers.set('Set-Cookie', `session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);

          return response;
        } catch (error) {
          console.error('Auth callback error:', error);
          return withCORS(Response.redirect('/?auth=callback_error', 302));
        }
      },
    },

    "/api/auth/logout": {
      async POST(req) {
        // Get session from cookie
        const cookies = req.headers.get('Cookie') || '';
        const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('session='));

        if (sessionCookie) {
          const sessionId = sessionCookie.split('=')[1].trim();
          authStore.removeSession(sessionId);
        }

        const response = withCORS(Response.json({ success: true }));
        response.headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

        return response;
      },
    },

    "/api/auth/session": {
      async GET(req) {
        // Get session from cookie
        const cookies = req.headers.get('Cookie') || '';
        const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('session='));

        if (!sessionCookie) {
          return withCORS(Response.json({
            authenticated: false
          }));
        }

        const sessionId = sessionCookie.split('=')[1].trim();
        const session = authStore.getSession(sessionId);

        if (!session) {
          return withCORS(Response.json({
            authenticated: false
          }));
        }

        return withCORS(Response.json({
          authenticated: true,
          user: session.user
        }));
      },
    },

    "/api/auth/share": {
      async POST(req) {
        try {
          // Get session from cookie
          const cookies = req.headers.get('Cookie') || '';
          const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('session='));

          if (!sessionCookie) {
            return withCORS(Response.json({
              success: false,
              error: 'Not authenticated'
            }, { status: 401 }));
          }

          const sessionId = sessionCookie.split('=')[1].trim();
          const session = authStore.getSession(sessionId);

          if (!session) {
            return withCORS(Response.json({
              success: false,
              error: 'Session expired'
            }, { status: 401 }));
          }

          const body = await req.json();
          const { text, quoteTweetId } = body;

          if (!text || typeof text !== 'string') {
            return withCORS(Response.json({
              success: false,
              error: 'Text is required'
            }, { status: 400 }));
          }

          // Post the tweet (with optional quote)
          const result = await postTweet(session.accessToken, text, quoteTweetId);

          return withCORS(Response.json({
            success: true,
            tweetId: result.id,
            url: `https://x.com/${session.user.username}/status/${result.id}`
          }));

        } catch (error) {
          console.error('Share tweet error:', error);
          return withCORS(Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to share tweet'
          }, { status: 500 }));
        }
      },
    },

    // Catch-all for frontend
    "/*": index,
  },

  // Custom fetch to handle WebSocket upgrades
  fetch(req, server) {
    // Handle WebSocket upgrade
    if (req.headers.get("upgrade") === "websocket") {
      if (server.upgrade(req)) {
        return new Response(null); // Connection was upgraded
      }
      return new Response("WebSocket upgrade failed", { status: 500 });
    }
    // Let routes handle everything else
    return new Response(null, { status: 404 });
  },

  // WebSocket support
  websocket: {
    open(ws) {
      wsClients.add(ws);
      console.log(`📡 WebSocket connected (${wsClients.size} total)`);
      
      // Send stats immediately - client will fetch filtered data
      ws.send(JSON.stringify({
        type: "connected",
        stats: ratioStore.getStats(),
      }));
    },
    message(ws, message) {
      try {
        const data = JSON.parse(message as string);
        
        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    },
    close(ws) {
      wsClients.delete(ws);
      console.log(`📡 WebSocket disconnected (${wsClients.size} remaining)`);
    },
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 X Ratio Finder server running at ${server.url}`);
console.log(`📊 WebSocket available for real-time updates`);
console.log(`🔄 Polling X API every 5 minutes`);
