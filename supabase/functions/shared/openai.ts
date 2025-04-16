
// OpenAI API functions

export async function callOpenAI(
  userPrompt: string, 
  systemPrompt: string, 
  openAIApiKey: string,
  metadata: {
    requestId: string,
    timestamp: string,
    cacheBuster: string,
    deploymentId: string,
    functionVersion: string,
    model?: string
  }
) {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not found');
  }
  
  const { 
    requestId,
    timestamp, 
    cacheBuster, 
    deploymentId, 
    functionVersion,
    model = 'gpt-4o-mini' // Default to gpt-4o-mini if not specified
  } = metadata;
  
  console.log(`[${timestamp}][REQ:${requestId}] Calling OpenAI API with model: ${model}`);
  console.log(`[${timestamp}][REQ:${requestId}] Cache buster: ${cacheBuster}`);
  console.log(`[${timestamp}][REQ:${requestId}] SYSTEM PROMPT EXCERPT:\n${systemPrompt.substring(0, 200)}...`);
  console.log(`[${timestamp}][REQ:${requestId}] USER PROMPT EXCERPT:\n${userPrompt.substring(0, 200)}...`);
  
  // Add retry logic for OpenAI API calls
  let attempts = 0;
  const maxAttempts = 3;
  let lastError = null;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Request-ID': requestId,
          'X-Timestamp': timestamp,
          'X-Cache-Buster': cacheBuster,
          'X-Deployment-ID': deploymentId,
          'X-Function-Version': functionVersion
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[${timestamp}][REQ:${requestId}] OpenAI API error:`, {
          status: response.status,
          error: errorData
        });
        
        // If we hit a rate limit, wait and retry
        if (response.status === 429) {
          console.log(`[${timestamp}][REQ:${requestId}] Rate limit hit. Attempt ${attempts + 1}/${maxAttempts}`);
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000 * attempts)); // Exponential backoff
            continue;
          }
        }
        
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      try {
        const data = await response.json();
        console.log(`[${timestamp}][REQ:${requestId}] OpenAI response received, model used: ${data.model}`);
        console.log(`[${timestamp}][REQ:${requestId}] Response length: ${data.choices[0].message.content.length} chars`);
        console.log(`[${timestamp}][REQ:${requestId}] RESPONSE EXCERPT:\n${data.choices[0].message.content.substring(0, 200)}...`);
        return data;
      } catch (error) {
        console.error(`[${timestamp}][REQ:${requestId}] Error parsing OpenAI response:`, error);
        throw new Error(`Error parsing OpenAI response: ${error.message}`);
      }
    } catch (error) {
      lastError = error;
      attempts++;
      if (attempts < maxAttempts) {
        console.log(`[${timestamp}][REQ:${requestId}] Retrying OpenAI call. Attempt ${attempts}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 2000 * attempts)); // Exponential backoff
        continue;
      }
      break;
    }
  }
  
  throw lastError || new Error('Failed to call OpenAI API after multiple attempts');
}

export function createErrorResponse(error: any, metadata: any) {
  return new Response(
    JSON.stringify({
      error: error.message || "Unknown error",
      timestamp: metadata.timestamp,
      requestId: metadata.requestId,
      ...metadata
    }),
    {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, pragma, expires, x-no-cache, Authorization, x-timestamp, x-random, x-application-name, x-cache-buster',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  );
}
