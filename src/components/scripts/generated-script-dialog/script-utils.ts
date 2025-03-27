
import { supabase } from '@/integrations/supabase/client';

/**
 * Generuje skrypt na podstawie ID szablonu i danych grupy docelowej
 */
export const generateScript = async (templateId: string, targetAudienceId: string): Promise<string> => {
  try {
    console.log('Generowanie skryptu dla szablonu:', templateId);
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
    
    // Wywołanie funkcji generate-script
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`Próba ${attempts + 1}/${maxAttempts}: Wywołanie funkcji generate-script`);
        
        const { data, error } = await supabase.functions.invoke('generate-script', {
          body: {
            templateId,
            targetAudience
          },
        });
        
        if (error) {
          console.error(`Próba ${attempts + 1}/${maxAttempts}: Błąd generowania skryptu:`, error);
          lastError = error;
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Czekaj 1 sekundę przed ponowną próbą
          continue;
        }
        
        if (!data || !data.script) {
          console.error(`Próba ${attempts + 1}/${maxAttempts}: Brak wygenerowanego skryptu`);
          lastError = new Error('Nie wygenerowano skryptu');
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        
        console.log('Skrypt został pomyślnie wygenerowany');
        return data.script;
      } catch (invokeError) {
        console.error(`Próba ${attempts + 1}/${maxAttempts}: Wyjątek podczas wywoływania funkcji:`, invokeError);
        lastError = invokeError;
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Jeśli wszystkie próby zawiodły, rzucamy wyjątek
    console.error('Wszystkie próby generowania skryptu zakończyły się niepowodzeniem:', lastError);
    throw lastError || new Error('Nie udało się wygenerować skryptu po wielu próbach');
  } catch (error) {
    console.error('Błąd generowania skryptu:', error);
    // Zwracamy przykładowy skrypt w przypadku błędu
    return generateSampleScript(templateId);
  }
};

/**
 * Generuje przykładowy skrypt na podstawie ID szablonu
 * To jest funkcja zapasowa w przypadku błędu API
 */
export const generateSampleScript = (templateId: string): string => {
  return `# Przykładowy skrypt dla szablonu: ${templateId}

## Wprowadzenie
Witaj w naszym skrypcie przygotowanym specjalnie dla Twojej grupy docelowej!

## Główne punkty
1. Zacznij od nawiązania kontaktu z odbiorcą
2. Przedstaw główne korzyści Twojej oferty
3. Pokaż, jak Twój produkt rozwiązuje problemy odbiorcy
4. Zaprezentuj case study lub historie sukcesu
5. Zakończ mocnym wezwaniem do działania

## Szczegółowy opis
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. Vivamus hendrerit arcu sed erat molestie vehicula. Sed auctor neque eu tellus rhoncus ut eleifend nibh porttitor. Ut in nulla enim.

## Przykładowe dialogi
- "Czy zauważyłeś, że [problem] staje się coraz większym wyzwaniem?"
- "Nasz produkt pozwala na [korzyść] bez konieczności [negatywny aspekt konkurencji]"
- "W ciągu ostatnich 6 miesięcy pomogliśmy ponad 100 klientom osiągnąć [rezultat]"

## Zakończenie
Dziękujemy za skorzystanie z naszego generatora skryptów! Możesz teraz dostosować ten szkic do swoich potrzeb.`;
};
