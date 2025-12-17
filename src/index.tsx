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

// ============================================
// Rate Limiting & API Protection
// ============================================
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 30; // Max 30 requests per minute per IP
const MAX_LIMIT_PARAM = 100; // Cap the 'limit' parameter

// In-memory rate limit store (resets on server restart)
const rateLimitStore = new Map<string, { count: number; windowStart: number }>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// Get client IP from request
function getClientIP(req: Request): string {
  // Check common proxy headers
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  // Fallback - in Bun we can try to get the socket address
  return 'unknown';
}

// Check rate limit and return true if request should be blocked
function isRateLimited(req: Request): boolean {
  const ip = getClientIP(req);
  const now = Date.now();
  
  const existing = rateLimitStore.get(ip);
  
  if (!existing || now - existing.windowStart > RATE_LIMIT_WINDOW_MS) {
    // New window
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return false;
  }
  
  // Within window - increment and check
  existing.count++;
  
  if (existing.count > RATE_LIMIT_MAX_REQUESTS) {
    console.warn(`⚠️ Rate limit exceeded for IP: ${ip} (${existing.count} requests)`);
    return true;
  }
  
  return false;
}

// Create rate limited response
function rateLimitedResponse(): Response {
  return new Response(JSON.stringify({ 
    error: 'Too many requests. Please slow down.',
    retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
  }), {
    status: 429,
    headers: { 
      "Content-Type": "application/json",
      "Retry-After": String(Math.ceil(RATE_LIMIT_WINDOW_MS / 1000))
    },
  });
}

// Allowed origins for API requests
const ALLOWED_ORIGINS = [
  'https://xratios.app',
  'https://www.xratios.app',
  'https://xratio.replit.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

// Secret header that frontend must include (blocks casual curl/script attempts)
const API_SECRET_HEADER = 'X-XRatio-Client';
const API_SECRET_VALUE = 'web-v1';

// Check if request is from an allowed origin (browser-based)
function isAllowedOrigin(req: Request): boolean {
  // First check: Require the secret header from frontend
  const clientHeader = req.headers.get(API_SECRET_HEADER);
  if (clientHeader !== API_SECRET_VALUE) {
    return false;
  }
  
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  
  // For same-origin requests (no origin header), check referer or allow if secret header is present
  if (!origin && !referer) {
    // Secret header is present, allow it (same-origin fetch from our frontend)
    return true;
  }
  
  // Check origin header
  if (origin) {
    if (ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
      return true;
    }
  }
  
  // Check referer header as fallback
  if (referer) {
    if (ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed.replace(/\/$/, '')))) {
      return true;
    }
  }
  
  return false;
}

// Create forbidden response for blocked origins
function forbiddenResponse(): Response {
  return new Response(JSON.stringify({ 
    error: 'Access denied'
  }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

// CORS headers helper - use specific origin instead of wildcard
function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => 
    origin.startsWith(allowed.replace(/\/$/, ''))
  ) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

// Add CORS headers to any response
function withCORS(response: Response, req?: Request): Response {
  const headers = req ? getCorsHeaders(req) : {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  
  Object.entries(headers).forEach(([key, value]) => {
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

const AUTH_FILTER = new Set(
  process.env.AUTH_TOKEN ? [process.env.AUTH_TOKEN] : []
);

const server = serve({
  routes: {
    // API routes
    "/api/ratios": {
      async GET(req) {
        // Rate limit check
        if (isRateLimited(req)) {
          return withCORS(rateLimitedResponse(), req);
        }
        
        // Origin check - block requests not from allowed origins
        if (!isAllowedOrigin(req)) {
          console.warn(`🚫 Blocked request from unauthorized origin`);
          return withCORS(forbiddenResponse(), req);
        }
        
        try {
          const url = new URL(req.url);
          // Cap the limit parameter to prevent abuse
          const requestedLimit = parseInt(url.searchParams.get('limit') || '100');
          const limit = Math.min(Math.max(1, requestedLimit), MAX_LIMIT_PARAM);
          const sortBy = url.searchParams.get('sortBy') || 'recency';
          const showOnlyBrutal = url.searchParams.get('showOnlyBrutal') === 'true';
          const showOnlyLethal = url.searchParams.get('showOnlyLethal') === 'true';
          const username = url.searchParams.get('username');
          const minLikes = parseInt(url.searchParams.get('minLikes') || '1000');

          let ratios = ratioStore.getAllRatios();
          
          ratios = ratios.filter(r => !AUTH_FILTER.has(r.parent.authorId || ''));

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
          
          // Only return essential stats, not internal details
          const publicStats = {
            total: ratioStore.getStats().total,
          };
          
          return withCORS(Response.json({
            success: true,
            data: ratios,
            stats: publicStats,
          }), req);
        } catch (error) {
          console.error('API Error:', error);
          return withCORS(Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch ratios'
          }, { status: 500 }), req);
        }
      },
    },

    "/api/leaderboards": {
      async GET(req) {
        // Rate limit check
        if (isRateLimited(req)) {
          return withCORS(rateLimitedResponse(), req);
        }
        
        // Origin check
        if (!isAllowedOrigin(req)) {
          console.warn(`🚫 Blocked leaderboards request from unauthorized origin`);
          return withCORS(forbiddenResponse(), req);
        }
        
        try {
          const leaderboards = ratioStore.getLeaderboards(AUTH_FILTER);
          return withCORS(Response.json({
            success: true,
            data: leaderboards,
          }), req);
        } catch (error) {
          console.error('Leaderboards API Error:', error);
          return withCORS(Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch leaderboards'
          }, { status: 500 }), req);
        }
      },
    },
    
    // /api/refresh removed - was a security risk (allowed anyone to trigger X API calls)
    
    "/api/status": {
      async GET(req) {
        // Rate limit check
        if (isRateLimited(req)) {
          return withCORS(rateLimitedResponse(), req);
        }
        
        // Origin check
        if (!isAllowedOrigin(req)) {
          return withCORS(forbiddenResponse(), req);
        }
        
        // Only return public-safe information (no internal stats)
        const stats = ratioStore.getStats();
        return withCORS(Response.json({
          success: true,
          totalRatios: stats.total,
          timestamp: Date.now(),
        }), req);
      },
    },

    // Serve OG image for social sharing
    "/assets/og-image.jpg": {
      GET() {
        return new Response(Bun.file(import.meta.dir + "/assets/og-image.jpg"), {
          headers: { "Content-Type": "image/jpeg" },
        });
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
