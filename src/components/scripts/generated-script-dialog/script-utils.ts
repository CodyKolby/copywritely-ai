
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Generuje skrypt na podstawie ID szablonu i danych grupy docelowej
 */
export const generateScript = async (templateId: string, targetAudienceId: string): Promise<string> => {
  try {
    console.log('Generowanie skryptu dla szablonu:', templateId);
    console.log('ID grupy docelowej:', targetAudienceId);
    
    // Walidacja danych wejściowych
    if (!targetAudienceId) {
      console.error('Brak ID grupy docelowej');
      toast.error('Brak identyfikatora grupy docelowej');
      throw new Error('Brak identyfikatora grupy docelowej');
    }
    
    // Sprawdzenie czy grupa docelowa istnieje przed próbą generowania skryptu
    console.log('Sprawdzam czy grupa docelowa istnieje w bazie danych...');
    const { data: audienceData, error: checkError } = await supabase
      .from('target_audiences')
      .select('id, name')
      .eq('id', targetAudienceId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Błąd podczas sprawdzania grupy docelowej:', checkError);
      toast.error('Błąd podczas sprawdzania grupy docelowej');
      throw new Error(`Błąd podczas sprawdzania grupy docelowej: ${checkError.message}`);
    }
    
    if (!audienceData) {
      console.error('Grupa docelowa nie istnieje w bazie danych. ID:', targetAudienceId);
      toast.error('Nie znaleziono grupy docelowej w bazie danych');
      return generateSampleScript(templateId); // Używamy przykładowego skryptu jako fallback
    }
    
    console.log('Grupa docelowa znaleziona:', audienceData);
    console.log('Wywołuję edge function generate-script...');
    
    // Wywołanie Edge Function do generowania skryptu
    const { data, error } = await supabase.functions.invoke('generate-script', {
      body: {
        templateId,
        targetAudienceId,
      },
    });
    
    if (error) {
      console.error('Błąd podczas wywoływania funkcji generate-script:', error);
      toast.error('Błąd podczas generowania skryptu');
      return generateSampleScript(templateId); // Używamy przykładowego skryptu jako fallback
    }
    
    console.log('Odpowiedź z edge function:', data);
    
    if (!data || !data.script) {
      console.error('Brak wygenerowanego skryptu w odpowiedzi');
      toast.error('Brak wygenerowanego skryptu w odpowiedzi');
      return generateSampleScript(templateId); // Używamy przykładowego skryptu jako fallback
    }
    
    return data.script;
  } catch (error) {
    console.error('Błąd generowania skryptu:', error);
    toast.error('Błąd podczas generowania skryptu');
    return generateSampleScript(templateId); // Używamy przykładowego skryptu jako fallback
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

## Przykładowe dialogi
- "Czy zauważyłeś, że [problem] staje się coraz większym wyzwaniem?"
- "Nasz produkt pozwala na [korzyść] bez konieczności [negatywny aspekt konkurencji]"
- "W ciągu ostatnich 6 miesięcy pomogliśmy ponad 100 klientom osiągnąć [rezultat]"

## Zakończenie
Dziękujemy za skorzystanie z naszego generatora skryptów! Możesz teraz dostosować ten szkic do swoich potrzeb.

UWAGA: To jest przykładowy skrypt wygenerowany z powodu błędu połączenia z API OpenAI.`;
};
