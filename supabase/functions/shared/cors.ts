
// Expanded CORS headers to accept all necessary custom headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-no-cache, Authorization, x-timestamp, x-random, x-application-name, x-cache-buster',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
  'Access-Control-Max-Age': '86400' // 24 hours
};

// Handle OPTIONS requests for CORS preflight
export function handleOptions(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }
  return null;
}
