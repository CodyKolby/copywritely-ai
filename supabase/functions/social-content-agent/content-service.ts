
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
  const hookToUse = selectedHook || hookOutput.hooks[0];
  
  return `Timestamp to avoid caching: ${currentTimestamp}
  Random value to break cache: ${requestCacheBuster}
  Request ID: ${requestId}
  Deployment ID: ${deploymentId}
  Function version: ${functionVersion}
  
  Oto dane o grupie docelowej:
  ${JSON.stringify(targetAudience, null, 2)}
  
  Cel reklamy: ${advertisingGoal || 'Brak określonego celu'}
  
  Wybrany hook: ${hookToUse}
  
  Tematyka posta: ${hookOutput.theme || 'Brak określonej tematyki'}
  
  Sugerowana forma: ${hookOutput.form || 'post tekstowy'}
  
  Platforma: ${platform || 'Meta (Instagram/Facebook)'}
  
  Wezwanie do działania: ${hookOutput.cta || 'Sprawdź więcej'}`;
}
