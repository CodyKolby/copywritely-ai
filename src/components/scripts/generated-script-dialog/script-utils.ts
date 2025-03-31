
import { supabase } from '@/integrations/supabase/client';
import { GenerateScriptResponse } from './ai-agents-service';

/**
 * Wersja utylity do generowania skryptów
 */
export const SCRIPT_UTILS_VERSION = '1.11.0';

/**
 * Generuje skrypt na podstawie szablonu i grupy docelowej
 */
export async function generateScript(
  templateId: string,
  targetAudienceId: string,
  advertisingGoal: string = ''
): Promise<GenerateScriptResponse> {
  console.log(`[script-utils v${SCRIPT_UTILS_VERSION}] Generowanie skryptu`, {
    templateId,
    targetAudienceId,
    advertisingGoal,
  });

  try {
    // Wywołanie funkcji Edge za pomocą supabase.functions.invoke
    const { data, error } = await supabase.functions.invoke('generate-script', {
      body: {
        templateId,
        targetAudienceId,
        advertisingGoal,
        debugInfo: true
      },
    });
    
    if (error) {
      console.error('Błąd wywołania funkcji Edge:', error);
      throw new Error(`Nie udało się wygenerować skryptu: ${error.message}`);
    }
    
    if (!data) {
      console.error('Funkcja Edge nie zwróciła żadnych danych');
      throw new Error('Otrzymano pustą odpowiedź z funkcji generowania skryptu');
    }
    
    const response = data as GenerateScriptResponse;
    
    console.log(`[script-utils v${SCRIPT_UTILS_VERSION}] Skrypt wygenerowany pomyślnie`);
    console.log(`[script-utils v${SCRIPT_UTILS_VERSION}] Najlepszy hook:`, response.bestHook || '(brak)');
    console.log(`[script-utils v${SCRIPT_UTILS_VERSION}] Struktura reklamy:`, response.adStructure || '(brak)');
    
    // Sprawdzamy, czy otrzymaliśmy zredagowany skrypt
    if (response.debug?.rawScript) {
      console.log(`[script-utils v${SCRIPT_UTILS_VERSION}] Otrzymano zredagowany skrypt`);
      console.log(`[script-utils v${SCRIPT_UTILS_VERSION}] Oryginalny skrypt (fragment):`, 
        response.debug.rawScript.substring(0, 100) + '...');
      console.log(`[script-utils v${SCRIPT_UTILS_VERSION}] Zredagowany skrypt (fragment):`, 
        response.script.substring(0, 100) + '...');
    }
    
    return {
      script: response.script || '',
      bestHook: response.bestHook || '',
      adStructure: response.adStructure || '',
      debug: response.debug
    };
  } catch (error) {
    console.error(`[script-utils v${SCRIPT_UTILS_VERSION}] Błąd generowania skryptu:`, error);
    // Rzucamy błąd na górę, aby komponent mógł go obsłużyć
    throw error;
  }
}
