/**
 * Netflix Clone - TMDB Cloudflare Worker Proxy
 * 
 * This worker acts as a middleman between your app and TMDB.
 * Benefits:
 * 1. Hides your TMDB API Key from the public and even your own backend if needed.
 * 2. Uses Cloudflare's Edge Caching to drastically speed up movie fetching.
 * 3. Cloudflare's WAF (Web Application Firewall) protects this endpoint from hackers and DDoS.
 */

export default {
  async fetch(request, env, ctx) {
    // 1. Handle CORS (Allow your frontend/backend to access this proxy)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Change to 'https://yourdomain.com' in production
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 2. Parse the incoming request URL
    const url = new URL(request.url);
    const tmdbPath = url.pathname.replace('/tmdb', ''); // Remove the /tmdb prefix
    const tmdbQuery = url.search;

    // Security Check: Only allow GET requests to prevent abuse
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Construct the actual TMDB API URL
    // Environment variables (like TMDB_API_KEY) are securely stored in Cloudflare Dashboard
    const tmdbUrl = `https://api.themoviedb.org/3${tmdbPath}${tmdbQuery}`;
    const TMDB_API_KEY = env.TMDB_API_KEY; // Store this as a Secret in Cloudflare

    if (!TMDB_API_KEY) {
      return new Response(JSON.stringify({ error: 'TMDB_API_KEY secret is not configured in Cloudflare' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Check Cloudflare Cache first (saves API quota and speeds up response)
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    let response = await cache.match(cacheKey);

    if (!response) {
      // 5. If not in cache, fetch from TMDB securely
      const tmdbResponse = await fetch(tmdbUrl, {
        headers: {
          'Authorization': `Bearer ${TMDB_API_KEY}`,
          'Accept': 'application/json'
        }
      });

      // Clone response to modify headers and put in cache
      response = new Response(tmdbResponse.body, tmdbResponse);
      response.headers.set('Access-Control-Allow-Origin', '*');
      
      // Cache valid responses for 4 hours
      if (response.status === 200) {
        response.headers.set('Cache-Control', 'public, max-age=14400');
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }
    } else {
      // If it was a cache hit, ensure CORS headers are present
      response = new Response(response.body, response);
      response.headers.set('Access-Control-Allow-Origin', '*');
    }

    return response;
  },
};
