
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
    
    // Wywołanie funkcji Edge do generowania skryptu (zostanie zaimplementowane później)
    // Tutaj tylko szkielet na przyszłość
    const { data, error } = await supabase.functions.invoke('ai-agents/script-generator', {
      body: {
        targetAudience,
        templateType: templateId,
        selectedHook,
        selectedAngle
      },
    });
    
    if (error) {
      console.error('Błąd generowania skryptu:', error);
      throw new Error('Nie udało się wygenerować skryptu');
    }
    
    return "Ten agent zostanie zaimplementowany w następnym kroku.";
  } catch (error) {
    console.error('Błąd generowania skryptu:', error);
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
