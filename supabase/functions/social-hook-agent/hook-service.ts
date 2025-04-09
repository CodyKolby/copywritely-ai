
// Process and extract hooks from OpenAI response
export function processHookResponse(responseText: string): {
  hooks: string[];
  theme: string;
  form: string;
  cta: string;
} {
  console.log(`Processing hook response: ${responseText.substring(0, 200)}...`);
  
  try {
    // Clean text of code markers if they exist
    if (responseText.includes('```json')) {
      responseText = responseText.replace(/```json|```/g, '').trim();
    }
    
    // Try to parse as JSON
    try {
      const parsedResponse = JSON.parse(responseText);
      
      // Validate and ensure expected fields exist
      return {
        hooks: Array.isArray(parsedResponse.hooks) && parsedResponse.hooks.length > 0 
          ? parsedResponse.hooks 
          : ["Nie udało się wygenerować hooków"],
        theme: parsedResponse.theme || "Nie udało się określić tematyki",
        form: parsedResponse.form || "post tekstowy",
        cta: parsedResponse.cta || "Sprawdź więcej"
      };
    } catch (e) {
      console.error(`Failed to parse JSON response: ${e}`);
      
      // If not parseable as JSON, manually extract hooks, theme and form
      const hooksMatch = responseText.match(/hooks.*?[\[\{]([^\]\}]+)[\]\}]/is);
      const themeMatch = responseText.match(/theme["\s:]+([^"]+)["]/is);
      const formMatch = responseText.match(/form["\s:]+([^"]+)["]/is);
      const ctaMatch = responseText.match(/cta["\s:]+([^"]+)["]/is);
      
      // Extract hooks
      let hooks = [];
      if (hooksMatch && hooksMatch[1]) {
        hooks = hooksMatch[1].split(',').map(h => h.replace(/["]/g, '').trim());
        if (hooks.length === 0) {
          hooks = ["Nie udało się wygenerować hooków"];
        }
      } else {
        hooks = ["Nie udało się wygenerować hooków"];
      }
      
      return {
        hooks: hooks,
        theme: themeMatch ? themeMatch[1].trim() : "Nie udało się określić tematyki",
        form: formMatch ? formMatch[1].trim() : "post tekstowy",
        cta: ctaMatch ? ctaMatch[1].trim() : "Sprawdź więcej"
      };
    }
  } catch (e) {
    console.error(`Error processing response: ${e}`);
    return {
      hooks: ["Nie udało się wygenerować hooków"],
      theme: "Nie udało się określić tematyki",
      form: "post tekstowy",
      cta: "Sprawdź więcej"
    };
  }
}

// Construct user prompt for hook generation
export function constructHookPrompt(requestData: any, requestId: string, deploymentId: string, functionVersion: string): string {
  const { targetAudience, advertisingGoal, platform, timestamp } = requestData;
  const startTime = timestamp || new Date().toISOString();
  const platformInfo = `Platforma: ${platform || 'Meta (Instagram/Facebook)'}`;
  const cacheBusterValue = `${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
  
  return `Timestamp to avoid caching: ${startTime}
  Request ID: ${requestId}
  Deployment ID: ${deploymentId}
  Function version: ${functionVersion}
  Random value to break cache: ${cacheBusterValue}
  
  Oto dane o grupie docelowej:
  ${JSON.stringify(targetAudience, null, 2)}
  
  Cel reklamy: ${advertisingGoal || 'Brak określonego celu'}
  
  ${platformInfo}
  
  Bazując na powyższych informacjach, stwórz 3 angażujące hooki, określ tematykę oraz najlepszą formę posta w social media.`;
}
