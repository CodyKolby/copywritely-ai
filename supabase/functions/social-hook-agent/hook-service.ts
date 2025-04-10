
// Process and extract hooks from OpenAI response
export function processHookResponse(responseText: string): {
  finalIntro: string;
} {
  console.log(`Processing hook response. Length: ${responseText.length}`);
  console.log(`Response start: ${responseText.substring(0, 200)}...`);
  console.log(`FULL RESPONSE: ${responseText}`);
  
  // Default response in case of failure
  const defaultResponse = {
    finalIntro: "Czy wiesz, że..."
  };
  
  try {
    // Just return the cleaned response text as finalIntro
    return {
      finalIntro: responseText.trim()
    };
  } catch (e) {
    console.error(`Error processing response: ${e}`);
    return defaultResponse;
  }
}

// Construct user prompt for hook generation
export function constructHookPrompt(requestData: any, requestId: string, deploymentId: string, functionVersion: string): string {
  const { targetAudience, advertisingGoal, platform, timestamp } = requestData;
  const startTime = timestamp || new Date().toISOString();
  const platformInfo = `Platforma: ${platform || 'Meta (Instagram/Facebook)'} - ${advertisingGoal || 'Brak określonego celu'}`;
  const cacheBusterValue = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
  
  // Create debug section
  const debugSection = `
  --- DEBUG INFO ---
  Timestamp: ${startTime}
  Request ID: ${requestId}
  Deployment ID: ${deploymentId}
  Function version: ${functionVersion}
  Random value: ${cacheBusterValue}
  Platform: ${platform || 'Meta (Instagram/Facebook)'}
  `;
  
  // Convert target audience to a format suitable for the prompt
  const surveyData = JSON.stringify(targetAudience, null, 2);
  
  // Construct the prompt with all required variables
  const prompt = `Napisz intro przyciągające uwagę dla ${platformInfo} bazując na danych odbiorcy: ${surveyData.substring(0, 500)}...`;
  
  // Log the constructed prompt
  console.log(`[Hook Prompt] FULL PROMPT:\n${prompt}`);
  console.log(`[Hook Prompt] Constructed prompt:`, prompt.substring(0, 200) + '...');
  
  return prompt;
}
