
// Construct prompt for social content generation
export function constructContentPrompt(
  requestData: any, 
  requestId: string, 
  deploymentId: string, 
  functionVersion: string
): string {
  const { targetAudience, advertisingGoal, platform, hookOutput, timestamp, selectedHook } = requestData;
  const currentTimestamp = timestamp || new Date().toISOString();
  const requestCacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${deploymentId}-${requestId}`;
  
  // Determine which hook to use
  const hookToUse = selectedHook || (hookOutput?.hooks && hookOutput.hooks.length > 0 ? hookOutput.hooks[0] : 'Brak hooka');
  
  // Convert targetAudience to a format that can be used in the prompt
  const surveyData = JSON.stringify(targetAudience, null, 2);
  
  // Get theme from hookOutput or default
  const postTheme = hookOutput?.theme || 'Brak określonej tematyki';
  
  // Get platform info with advertising goal
  const platformInfo = `${platform || 'Meta (Instagram/Facebook)'} - ${advertisingGoal || 'Brak określonego celu'}`;
  
  // Create debug information for troubleshooting
  const debugSection = `
  --- DEBUG INFO ---
  Timestamp: ${currentTimestamp}
  Request ID: ${requestId}
  Deployment ID: ${deploymentId}
  Function version: ${functionVersion}
  Random value: ${requestCacheBuster}
  Platform: ${platform || 'Meta (Instagram/Facebook)'}
  Hook being used: ${hookToUse}
  Theme: ${postTheme}
  `;
  
  // Replace template variables in the system prompt (if using them)
  // This allows the system prompt to use variables like {{surveyData}}, {{selectedHook}}, etc.
  let prompt = `
${debugSection}

Dane z ankiety klienta: ${surveyData}

Gotowy HOOK: ${hookToUse}

Temat posta: ${postTheme}

Cel posta: ${platformInfo}

Forma: ${hookOutput?.form || 'post tekstowy'}

Wezwanie do działania: ${hookOutput?.cta || 'Sprawdź więcej'}
  `;
  
  // Log the constructed prompt for debugging - dodajemy pełny log
  console.log(`[Content Prompt] FULL PROMPT:\n${prompt}`);
  console.log(`[Content Prompt] Constructed prompt with variables replaced:`, prompt.substring(0, 200) + '...');
  
  return prompt;
}
