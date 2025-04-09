
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
  
  console.log(`[OpenAI Request][${requestId}] Calling OpenAI API with system prompt (first 100 chars): ${systemPrompt.substring(0, 100)}...`);
  console.log(`[OpenAI Request][${requestId}] Using model: gpt-4o`);

  try {
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
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }
      
      console.error(`[OpenAI Error][${requestId}] API returned status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'} (Status ${response.status})`);
    }

    const data = await response.json();
    console.log(`[OpenAI Success][${requestId}] Response received with ${data.choices?.length || 0} choices`);
    
    // Log part of the response for debugging
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      const content = data.choices[0].message.content;
      console.log(`[OpenAI Response][${requestId}] First 200 chars of content: ${content.substring(0, 200)}...`);
    }
    
    return data;
  } catch (error) {
    console.error(`[OpenAI Exception][${requestId}] Error calling OpenAI API:`, error);
    throw error;
  }
}

// Create an error response
export function createErrorResponse(error: Error, metadata: any) {
  const errorMessage = error.message || "Unknown error";
  console.error(`Creating error response: ${errorMessage}`, metadata);
  
  return new Response(
    JSON.stringify({ 
      error: errorMessage, 
      ...metadata,
      timestamp: new Date().toISOString()
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
