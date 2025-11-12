import { serve } from "bun";
import index from "./index.html";
import { poller } from "./server/poller";
import { ratioStore } from "./server/store";

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
          
          let ratios = ratioStore.getAllRatios();
          
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
            // Default: recency
            ratios.sort((a, b) => b.discoveredAt - a.discoveredAt);
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

          // Add user to tracked list
          ratioStore.addTrackedUser(cleanUsername);

          // Trigger enrichment for this user
          console.log(`🔍 Starting enrichment for filtered user: ${cleanUsername}`);

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
                },
                reply: {
                  id: ratio.reply.id,
                  author: ratio.reply.author.username,
                  authorProfileImage: ratio.reply.author.profile_image_url,
                  content: ratio.reply.text,
                  likes: ratio.reply.public_metrics.like_count,
                },
                ratio: ratio.ratio,
                isBrutalRatio: ratio.isBrutalRatio,
                isLethalRatio: ratio.isLethalRatio,
                isRatio: ratio.ratio >= 2,
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
                },
                reply: {
                  id: ratio.reply.id,
                  author: ratio.reply.author.username,
                  authorProfileImage: ratio.reply.author.profile_image_url,
                  content: ratio.reply.text,
                  likes: ratio.reply.public_metrics.like_count,
                },
                ratio: ratio.ratio,
                isBrutalRatio: ratio.isBrutalRatio,
                isLethalRatio: ratio.isLethalRatio,
                isRatio: ratio.ratio >= 2,
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
