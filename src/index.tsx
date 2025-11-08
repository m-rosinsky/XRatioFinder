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
    data: ratioStore.getAllRatios(),
    timestamp: Date.now(),
  });
});

const server = serve({
  routes: {
    // API routes
    "/api/ratios": {
      async GET() {
        try {
          const ratios = ratioStore.getAllRatios();
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
      
      // Send current data immediately
      ws.send(JSON.stringify({
        type: "initial_data",
        data: ratioStore.getAllRatios(),
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
