
import { corsHeaders } from "./cors.ts";

// Function to call OpenAI API
export async function callOpenAI(
  prompt: string, 
  systemPrompt: string, 
  openAIApiKey: string, 
  requestMetadata: {
    requestId: string;
    timestamp: string;
    cacheBuster: string;
    deploymentId: string;
    functionVersion: string;
  }
) {
  const { requestId, timestamp, cacheBuster, deploymentId, functionVersion } = requestMetadata;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Cache-Buster': cacheBuster,
      'X-Timestamp': timestamp,
      'X-Random': Math.random().toString(36).substring(2, 15),
      'X-Request-ID': requestId,
      'X-Deployment-ID': deploymentId,
      'X-Function-Version': functionVersion
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  return await response.json();
}

// Create an error response
export function createErrorResponse(error: Error, metadata: any) {
  return new Response(
    JSON.stringify({ 
      error: error.message || "Unknown error", 
      ...metadata
    }),
    { 
      status: 500, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      } 
    }
  );
}
