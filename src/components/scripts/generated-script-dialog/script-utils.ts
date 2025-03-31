
import { supabase } from '@/integrations/supabase/client';
import { GenerateScriptResponse } from './ai-agents-service';

/**
 * Wersja utylity do generowania skryptów
 */
export const SCRIPT_UTILS_VERSION = '1.13.0';

/**
 * Generuje skrypt na podstawie szablonu i grupy docelowej
 */
export async function generateScript(
  templateId: string,
  targetAudienceId: string,
  advertisingGoal: string = '',
  hookIndex: number = 0
): Promise<GenerateScriptResponse> {
  console.log(`[script-utils v${SCRIPT_UTILS_VERSION}] Generowanie skryptu`, {
    templateId,
    targetAudienceId,
    advertisingGoal,
    hookIndex
  });

  try {
    // Wywołanie funkcji Edge za pomocą supabase.functions.invoke
    const { data, error } = await supabase.functions.invoke('generate-script', {
      body: {
        templateId,
        targetAudienceId,
        advertisingGoal,
        hookIndex,
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
    console.log(`[script-utils v${SCRIPT_UTILS_VERSION}] Wybrany hook (indeks ${hookIndex}):`, response.bestHook || '(brak)');
    console.log(`[script-utils v${SCRIPT_UTILS_VERSION}] Liczba dostępnych hooków:`, response.allHooks?.length || 0);
    
    return {
      script: response.script || '',
      bestHook: response.bestHook || '',
      allHooks: response.allHooks || [],
      currentHookIndex: response.currentHookIndex || 0,
      totalHooks: response.totalHooks || 0,
      debug: response.debug
    };
  } catch (error) {
    console.error(`[script-utils v${SCRIPT_UTILS_VERSION}] Błąd generowania skryptu:`, error);
    // Rzucamy błąd na górę, aby komponent mógł go obsłużyć
    throw error;
  }
}
