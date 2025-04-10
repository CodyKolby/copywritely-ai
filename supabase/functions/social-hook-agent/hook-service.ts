
// Process and extract hooks from OpenAI response
export function processHookResponse(responseText: string): {
  hooks: string[];
  theme: string;
  form: string;
  cta: string;
} {
  console.log(`Processing hook response. Length: ${responseText.length}`);
  console.log(`Response start: ${responseText.substring(0, 200)}...`);
  console.log(`FULL RESPONSE: ${responseText}`);
  
  // Default response in case of failure
  const defaultResponse = {
    hooks: ["Nie udało się wygenerować hooków"],
    theme: "Nie udało się określić tematyki",
    form: "post tekstowy",
    cta: "Sprawdź więcej"
  };
  
  try {
    // Clean text of code markers if they exist
    let cleanedText = responseText;
    if (responseText.includes('```json')) {
      cleanedText = responseText.replace(/```json|```/g, '').trim();
      console.log('Cleaned JSON markers from response');
    }
    
    // Try to parse as JSON
    try {
      const parsedResponse = JSON.parse(cleanedText);
      console.log('Successfully parsed response as JSON:', {
        hasHooks: Array.isArray(parsedResponse.hooks),
        hookCount: Array.isArray(parsedResponse.hooks) ? parsedResponse.hooks.length : 0,
        theme: parsedResponse.theme ? 'present' : 'missing',
        form: parsedResponse.form ? 'present' : 'missing',
        cta: parsedResponse.cta ? 'present' : 'missing'
      });
      
      // Validate and ensure expected fields exist
      return {
        hooks: Array.isArray(parsedResponse.hooks) && parsedResponse.hooks.length > 0 
          ? parsedResponse.hooks 
          : defaultResponse.hooks,
        theme: parsedResponse.theme || defaultResponse.theme,
        form: parsedResponse.form || defaultResponse.form,
        cta: parsedResponse.cta || defaultResponse.cta
      };
    } catch (jsonError) {
      console.error(`Failed to parse JSON response: ${jsonError}`);
      console.log('Attempting to extract data using regex patterns');
      
      // If not parseable as JSON, manually extract hooks, theme and form
      const extractHooks = () => {
        // Look for hooks in various formats
        const hooksArrayPattern = /hooks["'\s]?:["'\s]?\[(.*?)\]/is;
        const hooksObjectPattern = /hooks["'\s]?:["'\s]?\{(.*?)\}/is;
        const hooksFreeTextPattern = /hooks?["'\s]?:["'\s]?(.*?)(?:,|\n|$)/is;
        
        let hooksMatch = responseText.match(hooksArrayPattern) || 
                         responseText.match(hooksObjectPattern) || 
                         responseText.match(hooksFreeTextPattern);
        
        if (hooksMatch && hooksMatch[1]) {
          // Try to extract hooks as an array
          console.log('Found potential hooks match:', hooksMatch[1].substring(0, 50) + '...');
          
          // Look for quoted strings that might be hooks
          const quotedStrings = hooksMatch[1].match(/"([^"]*)"|'([^']*)'/g);
          if (quotedStrings && quotedStrings.length > 0) {
            return quotedStrings.map(s => s.replace(/["']/g, '').trim());
          }
          
          // If no quoted strings, try comma separation
          return hooksMatch[1].split(',').map(h => h.replace(/["']/g, '').trim());
        }
        
        // Try looking for numbered lists
        const numberedListPattern = /\d+\.\s+(.*?)(?:\n|$)/g;
        const numberedMatches = [...responseText.matchAll(numberedListPattern)];
        if (numberedMatches.length > 0) {
          console.log('Found potential hooks in numbered list format');
          return numberedMatches.map(match => match[1].trim());
        }
        
        console.error('Could not extract hooks using any pattern');
        return defaultResponse.hooks;
      };
      
      const extractField = (fieldName: string, defaultValue: string) => {
        const pattern = new RegExp(`${fieldName}["'\\s]?:["'\\s]?([^"',\\n]+|"[^"]*"|'[^']*')`, 'i');
        const match = responseText.match(pattern);
        if (match && match[1]) {
          return match[1].replace(/["']/g, '').trim();
        }
        return defaultValue;
      };
      
      const hooks = extractHooks();
      const theme = extractField('theme', defaultResponse.theme);
      const form = extractField('form', defaultResponse.form);
      const cta = extractField('cta', defaultResponse.cta);
      
      console.log('Extracted data using regex:', {
        hookCount: hooks.length,
        theme,
        form,
        cta
      });
      
      return {
        hooks: hooks.length > 0 ? hooks : defaultResponse.hooks,
        theme,
        form,
        cta
      };
    }
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
  const prompt = `Twoim zadaniem jest napisanie "TESTDUPADUPA"`;
  
  // Log the constructed prompt - dodajemy pełny log
  console.log(`[Hook Prompt] FULL PROMPT:\n${prompt}`);
  console.log(`[Hook Prompt] Constructed prompt:`, prompt.substring(0, 200) + '...');
  
  return prompt;
}
