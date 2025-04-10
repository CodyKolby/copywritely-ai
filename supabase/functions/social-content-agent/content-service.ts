
// Construct prompt for social content generation
export function constructContentPrompt(
  requestData: any, 
  requestId: string, 
  deploymentId: string, 
  functionVersion: string
): string {
  const { targetAudience, advertisingGoal, platform, hookOutput, timestamp } = requestData;
  const currentTimestamp = timestamp || new Date().toISOString();
  const requestCacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${deploymentId}-${requestId}`;
  
  // Get the finalIntro from hookOutput
  const finalIntro = hookOutput?.finalIntro || 'Czy wiesz, że...';
  
  // Convert targetAudience to a format that can be used in the prompt
  const surveyData = JSON.stringify(targetAudience, null, 2);
  
  // Get platform info with advertising goal
  const platformInfo = `${platform || 'Meta (Instagram/Facebook)'} - ${advertisingGoal || 'Brak określonego celu'}`;
  
  // Create debug information for troubleshooting
  const debugSection = `
  --- DEBUG INFO v${functionVersion} ---
  Timestamp: ${currentTimestamp}
  Request ID: ${requestId}
  Deployment ID: ${deploymentId}
  Function version: ${functionVersion}
  Random value: ${requestCacheBuster}
  Platform: ${platform || 'Meta (Instagram/Facebook)'}
  `;
  
  // Create base prompt template
  let prompt = `
${debugSection}

Dane z ankiety klienta: 
${surveyData}

Intro do posta: 
${finalIntro}

Cel posta: 
${platformInfo}
  `;
  
  // Log the constructed prompt for debugging
  console.log(`[Content Prompt][${requestId}][${functionVersion}] FULL PROMPT:\n${prompt}`);
  console.log(`[Content Prompt][${requestId}][${functionVersion}] Constructed prompt with variables replaced:`, prompt.substring(0, 200) + '...');
  
  return prompt;
}
