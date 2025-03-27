
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Generuje skrypt na podstawie ID szablonu i danych grupy docelowej
 */
export const generateScript = async (templateId: string, targetAudienceId: string): Promise<string> => {
  try {
    console.log('Generowanie skryptu dla szablonu:', templateId);
    console.log('ID grupy docelowej:', targetAudienceId);
    
    // Przechwyć błędy braku ID
    if (!targetAudienceId) {
      console.error('Brak ID grupy docelowej');
      toast.error('Brak identyfikatora grupy docelowej');
      return generateSampleScript(templateId);
    }
    
    // Dodajemy opóźnienie przed wywołaniem funkcji, aby dać czas na zapis danych w bazie
    console.log('Czekam 2 sekundy, aby upewnić się, że dane są zapisane w bazie...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Sprawdzenie, czy grupa docelowa istnieje przed próbą generowania skryptu
    console.log('Sprawdzam czy grupa docelowa istnieje w bazie danych...');
    const { data: audienceData, error: checkError } = await supabase
      .from('target_audiences')
      .select('*')
      .eq('id', targetAudienceId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Błąd podczas sprawdzania grupy docelowej:', checkError);
      toast.error('Błąd podczas sprawdzania grupy docelowej');
      throw new Error('Błąd podczas sprawdzania grupy docelowej');
    }
    
    if (!audienceData) {
      console.error('Grupa docelowa nie istnieje w bazie danych. ID:', targetAudienceId);
      toast.error('Nie znaleziono grupy docelowej w bazie danych');
      
      // Jeśli nie ma grupy docelowej, zwracamy przykładowy skrypt
      return generateSampleScript(templateId);
    }
    
    console.log('Grupa docelowa znaleziona:', audienceData);
    console.log('Wywołuję edge function generate-script...');
    
    // Wywołanie Edge Function do generowania skryptu
    console.log('📢 Wysyłam zapytanie do OpenAI przez Edge Function');
    
    const { data, error } = await supabase.functions.invoke('generate-script', {
      body: {
        templateId,
        targetAudienceId,
      },
    });
    
    if (error) {
      console.error('Błąd podczas wywoływania funkcji generate-script:', error);
      toast.error('Błąd podczas generowania skryptu');
      throw new Error(`Błąd podczas generowania skryptu: ${error.message}`);
    }
    
    console.log('📢 Dostałem odpowiedź z OpenAI przez Edge Function:', data);
    
    if (!data || !data.script) {
      console.error('Brak wygenerowanego skryptu w odpowiedzi');
      toast.error('Brak wygenerowanego skryptu w odpowiedzi');
      return generateSampleScript(templateId);
    }
    
    return data.script;
  } catch (error) {
    console.error('Błąd generowania skryptu:', error);
    toast.error('Błąd podczas generowania skryptu');
    // Zwracamy przykładowy skrypt w przypadku błędu
    return generateSampleScript(templateId);
  }
};

/**
 * Formatuje listę elementów do wyświetlenia w skrypcie
 */
const formatListItems = (items: string[] = []): string => {
  if (!items || items.length === 0) {
    return "- Brak zdefiniowanych elementów";
  }
  
  return items
    .filter(item => item && item.trim() !== "")
    .map((item, index) => `- ${item}`)
    .join("\n") || "- Brak zdefiniowanych elementów";
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
