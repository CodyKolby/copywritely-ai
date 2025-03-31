
import { supabase } from '@/integrations/supabase/client';
import { GenerateScriptResponse } from './ai-agents-service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Wersja utylity do generowania skryptów
 */
export const SCRIPT_UTILS_VERSION = '1.14.0';

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

/**
 * Zapisuje wygenerowany skrypt jako projekt
 */
export async function saveScriptAsProject(
  script: string, 
  hookText: string, 
  templateId: string, 
  user_id: string
): Promise<{id: string, title: string} | null> {
  try {
    if (!user_id || !script) {
      console.error('[script-utils] Nie można zapisać skryptu: brak id użytkownika lub treści skryptu');
      return null;
    }
    
    // Generowanie tytułu na podstawie contentu
    const title = generateTitleFromScript(script, hookText, templateId);
    
    console.log('[script-utils] Zapisywanie skryptu jako projekt...', {
      userId: user_id,
      title
    });
    
    const id = uuidv4();
    
    const { data, error } = await supabase
      .from('projects')
      .insert({
        id,
        user_id,
        title,
        content: script,
        status: 'Completed',
        type: 'script',
        title_auto_generated: true
      })
      .select('id, title')
      .single();
    
    if (error) {
      console.error('[script-utils] Błąd zapisywania skryptu:', error);
      throw error;
    }
    
    console.log('[script-utils] Skrypt zapisany pomyślnie jako projekt:', data);
    return data;
  } catch (error) {
    console.error('[script-utils] Błąd podczas zapisywania skryptu:', error);
    throw error; // Propagate the error so we can handle it in the calling function
  }
}

/**
 * Generuje tytuł projektu na podstawie skryptu
 */
function generateTitleFromScript(
  script: string,
  hookText: string = '',
  templateId: string = ''
): string {
  // Określenie typu skryptu na podstawie templateId
  let scriptType = '';
  switch (templateId) {
    case 'pas':
      scriptType = 'Skrypt PAS';
      break;
    case 'aida':
      scriptType = 'Skrypt AIDA';
      break;
    case 'social':
      scriptType = 'Skrypt Social Media';
      break;
    case 'ad':
      scriptType = 'Skrypt reklamowy';
      break;
    default:
      scriptType = 'Skrypt';
  }
  
  // Używamy fragmentu hooka jako części tytułu
  let hookFragment = '';
  if (hookText) {
    // Wyciągnij pierwsze zdanie lub fragment hooka (maksymalnie 30 znaków)
    const firstSentence = hookText.split(/[.!?]/, 1)[0].trim();
    hookFragment = firstSentence.length > 30 
      ? firstSentence.substring(0, 30) + '...'
      : firstSentence;
  }
  
  // Jeśli mamy fragment hooka, używamy go w tytule
  if (hookFragment) {
    return `${scriptType}: "${hookFragment}"`;
  }
  
  // Jeśli nie mamy hooka, próbujemy wyciągnąć fragment z początku skryptu
  const scriptStart = script.split(/[.!?]/, 1)[0].trim();
  const scriptFragment = scriptStart.length > 30 
    ? scriptStart.substring(0, 30) + '...'
    : scriptStart;
  
  return `${scriptType}: "${scriptFragment}"`;
}
