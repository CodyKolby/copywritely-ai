
import { supabase } from '@/integrations/supabase/client';

/**
 * Typy danych dla hooków i angles
 */
export interface HookAndAngle {
  hook: string;
  angle: string;
  type: 'problem' | 'desire' | 'curiosity' | 'shock' | 'personal';
}

export interface HooksResponse {
  hooks: HookAndAngle[];
}

/**
 * Typ zwracany przez funkcję generate-script
 */
export interface GenerateScriptResponse {
  script: string;
  bestHook: string;
  allHooks?: string[];
  currentHookIndex?: number;
  totalHooks?: number;
  debug?: {
    originalData: string;
    processedData: string;
    hookData: string;
    scriptData: string;
    advertisingGoal?: string;
  };
}

/**
 * Wywołuje agenta AI generującego hooki i angles
 */
export const generateHooksAndAngles = async (
  targetAudienceId: string, 
  templateId: string
): Promise<HooksResponse> => {
  try {
    console.log('Generowanie hooków dla szablonu:', templateId);
    console.log('ID grupy docelowej:', targetAudienceId);
    
    // Pobieranie danych grupy docelowej
    const { data: targetAudience, error: audienceError } = await supabase
      .from('target_audiences')
      .select('*')
      .eq('id', targetAudienceId)
      .single();
    
    if (audienceError) {
      console.error('Błąd pobierania danych grupy docelowej:', audienceError);
      throw new Error('Nie udało się pobrać danych grupy docelowej');
    }
    
    if (!targetAudience) {
      console.error('Nie znaleziono grupy docelowej');
      throw new Error('Nie znaleziono grupy docelowej');
    }
    
    // Wywołanie funkcji Edge do generowania hooków i angles - dodajemy retry logic
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;
    
    while (attempts < maxAttempts) {
      try {
        const { data, error } = await supabase.functions.invoke('ai-agents/hook-angle-generator', {
          body: {
            targetAudience,
            templateType: templateId,
          },
        });
        
        if (error) {
          console.error(`Próba ${attempts + 1}/${maxAttempts}: Błąd generowania hooków:`, error);
          lastError = error;
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Czekaj 1 sekundę przed ponowną próbą
          continue;
        }
        
        if (!data || !data.hooks) {
          console.error(`Próba ${attempts + 1}/${maxAttempts}: Brak wygenerowanych hooków`);
          lastError = new Error('Nie wygenerowano żadnych hooków');
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Czekaj 1 sekundę przed ponowną próbą
          continue;
        }
        
        return data as HooksResponse;
      } catch (invokeError) {
        console.error(`Próba ${attempts + 1}/${maxAttempts}: Wyjątek podczas wywoływania funkcji:`, invokeError);
        lastError = invokeError;
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Czekaj 1 sekundę przed ponowną próbą
      }
    }
    
    // Jeśli dotarliśmy tutaj, wszystkie próby zawiodły
    console.error('Wszystkie próby generowania hooków zakończyły się niepowodzeniem:', lastError);
    throw lastError || new Error('Nie udało się wygenerować hooków po wielu próbach');
  } catch (error) {
    console.error('Błąd generowania hooków i angles:', error);
    throw error;
  }
};

/**
 * Wywołuje agenta AI generującego skrypt
 */
export const generateScriptContent = async (
  targetAudienceId: string,
  templateId: string,
  selectedHook: string,
  selectedAngle: string
): Promise<string> => {
  try {
    console.log('Generowanie skryptu dla szablonu:', templateId);
    console.log('Wybrany hook:', selectedHook);
    console.log('Wybrany angle:', selectedAngle);
    
    // Pobieranie danych grupy docelowej
    const { data: targetAudience, error: audienceError } = await supabase
      .from('target_audiences')
      .select('*')
      .eq('id', targetAudienceId)
      .single();
    
    if (audienceError) {
      console.error('Błąd pobierania danych grupy docelowej:', audienceError);
      throw new Error('Nie udało się pobrać danych grupy docelowej');
    }
    
    if (!targetAudience) {
      console.error('Nie znaleziono grupy docelowej');
      throw new Error('Nie znaleziono grupy docelowej');
    }
    
    // Wywołanie funkcji Edge do generowania skryptu z retry logic
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;
    
    while (attempts < maxAttempts) {
      try {
        const { data, error } = await supabase.functions.invoke('ai-agents/script-generator', {
          body: {
            targetAudience,
            templateType: templateId,
            selectedHook,
            selectedAngle
          },
        });
        
        if (error) {
          console.error(`Próba ${attempts + 1}/${maxAttempts}: Błąd generowania skryptu:`, error);
          lastError = error;
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Czekaj 1 sekundę przed ponowną próbą
          continue;
        }
        
        if (!data || !data.scriptContent) {
          console.error(`Próba ${attempts + 1}/${maxAttempts}: Brak wygenerowanego skryptu`);
          lastError = new Error('Nie wygenerowano skryptu');
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Czekaj 1 sekundę przed ponowną próbą
          continue;
        }
        
        return data.scriptContent;
      } catch (invokeError) {
        console.error(`Próba ${attempts + 1}/${maxAttempts}: Wyjątek podczas wywoływania funkcji:`, invokeError);
        lastError = invokeError;
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Czekaj 1 sekundę przed ponowną próbą
      }
    }
    
    // Jeśli dotarliśmy tutaj, wszystkie próby zawiodły
    console.error('Wszystkie próby generowania skryptu zakończyły się niepowodzeniem:', lastError);
    throw lastError || new Error('Nie udało się wygenerować skryptu po wielu próbach');
  } catch (error) {
    console.error('Błąd generowania skryptu:', error);
    throw error;
  }
};

/**
 * Wywołuje funkcję Edge generate-script 
 * i zwraca obiekt z zawierający wygenerowane hooki i najlepszy hook
 */
export const generateBasicScript = async (
  targetAudienceId: string,
  templateId: string,
  hookIndex: number = 0
): Promise<GenerateScriptResponse> => {
  try {
    console.log('Generowanie podstawowego skryptu dla:', templateId);
    console.log('ID grupy docelowej:', targetAudienceId);
    console.log('Używam hooka o indeksie:', hookIndex);
    
    // Wywołanie funkcji Edge do generowania podstawowego skryptu z retry logic
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;
    
    while (attempts < maxAttempts) {
      try {
        const { data, error } = await supabase.functions.invoke('generate-script', {
          body: {
            targetAudienceId,
            templateId,
            hookIndex,
            debugInfo: true
          },
        });
        
        if (error) {
          console.error(`Próba ${attempts + 1}/${maxAttempts}: Błąd generowania podstawowego skryptu:`, error);
          lastError = error;
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Czekaj 1 sekundę przed ponowną próbą
          continue;
        }
        
        if (!data) {
          console.error(`Próba ${attempts + 1}/${maxAttempts}: Brak wygenerowanego skryptu`);
          lastError = new Error('Nie wygenerowano skryptu');
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Czekaj 1 sekundę przed ponowną próbą
          continue;
        }
        
        return data as GenerateScriptResponse;
      } catch (invokeError) {
        console.error(`Próba ${attempts + 1}/${maxAttempts}: Wyjątek podczas wywoływania funkcji:`, invokeError);
        lastError = invokeError;
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Czekaj 1 sekundę przed ponowną próbą
      }
    }
    
    // Jeśli dotarliśmy tutaj, wszystkie próby zawiodły
    console.error('Wszystkie próby generowania skryptu zakończyły się niepowodzeniem:', lastError);
    throw lastError || new Error('Nie udało się wygenerować skryptu po wielu próbach');
  } catch (error) {
    console.error('Błąd generowania podstawowego skryptu:', error);
    throw error;
  }
};

/**
 * Wywołuje agenta AI finalizującego skrypt
 */
export const finalizeScript = async (
  targetAudienceId: string,
  templateId: string,
  hooks: HookAndAngle[],
  scriptContent: string
): Promise<string> => {
  try {
    // Pobieranie danych grupy docelowej
    const { data: targetAudience, error: audienceError } = await supabase
      .from('target_audiences')
      .select('*')
      .eq('id', targetAudienceId)
      .single();
    
    if (audienceError) {
      console.error('Błąd pobierania danych grupy docelowej:', audienceError);
      throw new Error('Nie udało się pobrać danych grupy docelowej');
    }
    
    // Wywołanie funkcji Edge do finalizacji skryptu (zostanie zaimplementowane później)
    // Tutaj tylko szkielet na przyszłość
    const { data, error } = await supabase.functions.invoke('ai-agents/final-evaluator', {
      body: {
        targetAudience,
        templateType: templateId,
        hooks,
        scriptContent
      },
    });
    
    if (error) {
      console.error('Błąd finalizacji skryptu:', error);
      throw new Error('Nie udało się sfinalizować skryptu');
    }
    
    return "Ten agent zostanie zaimplementowany w następnym kroku.";
  } catch (error) {
    console.error('Błąd finalizacji skryptu:', error);
    throw error;
  }
};
