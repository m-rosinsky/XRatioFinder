import { serve } from "bun";
import index from "./index.html";
import { searchRecentRatios } from "./utils/x-api";

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

const server = serve({
  routes: {
    // API route for posts with ratios
    "/api/posts": {
      async GET(req) {
        try {
          const url = new URL(req.url);
          const minLikes = parseInt(url.searchParams.get('minLikes') || '500');
          const maxResults = parseInt(url.searchParams.get('maxResults') || '20');
          
          console.log(`🔍 Searching for ratios with min ${minLikes} likes...`);
          
          const ratios = await searchRecentRatios(minLikes, 7, maxResults);
          
          console.log(`✅ Found ${ratios.length} ratios`);
          
          return withCORS(Response.json({
            success: true,
            data: ratios
          }));
        } catch (error) {
          console.error('API Error:', error);
          return withCORS(Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch posts'
          }, { status: 500 }));
        }
      },
      async OPTIONS(req) {
        return withCORS(new Response(null, { status: 204 }));
      },
    },

    // Serve index.html for all unmatched routes.
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production",
});

console.log(`🚀 Server running at ${server.url}`);
