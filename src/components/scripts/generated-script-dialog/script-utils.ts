
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Configuration for the Edge Function
const SUPABASE_PROJECT_ID = 'jorbqjareswzdrsmepbv';
const EDGE_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/generate-script`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Generuje skrypt na podstawie ID szablonu i danych grupy docelowej
 */
export const generateScript = async (templateId: string, targetAudienceId: string): Promise<string> => {
  try {
    console.log('Generowanie skryptu dla szablonu:', templateId);
    console.log('ID grupy docelowej:', targetAudienceId);
    console.log('v1.8.0 - Zmodyfikowana metoda wywołania funkcji Edge do bezpośredniego użycia supabase.functions.invoke');
    
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
    
    // Używamy invoke zamiast bezpośredniego fetch do wywołania funkcji Edge
    console.time('Czas generowania skryptu');
    console.log('Wywołuję funkcję Edge przez supabase.functions.invoke');
    
    const { data, error } = await supabase.functions.invoke('generate-script', {
      body: {
        templateId,
        targetAudienceId,
        debugInfo: true // Zawsze ustawione na true aby otrzymać dane debug
      }
    });
    
    console.timeEnd('Czas generowania skryptu');
    
    // Sprawdzamy błędy
    if (error) {
      console.error('Błąd podczas wywoływania Edge function:', error);
      toast.error('Błąd podczas generowania skryptu');
      return generateSampleScript(templateId);
    }
    
    // Wyświetlamy w konsoli przeglądarki pełne dane debugowania
    if (data && data.debug) {
      console.group('🔍 DEBUG INFORMACJE:');
      
      console.group('📋 ORYGINALNE DANE Z ANKIETY:');
      console.log(data.debug.originalData);
      console.groupEnd();
      
      console.group('📝 DANE PO PRZETWORZENIU PRZEZ DATA PROCESSING AGENT:');
      console.log(data.debug.processedData);
      console.groupEnd();
      
      console.group('🔍 WYEKSTRAHOWANE HOOK DATA:');
      console.log(data.debug.hookData);
      console.groupEnd();
      
      console.group('🔍 WYEKSTRAHOWANE SCRIPT DATA:');
      console.log(data.debug.scriptData);
      console.groupEnd();
      
      console.groupEnd();
    } else {
      console.warn('Brak danych debug w odpowiedzi - sprawdź czy parametr debugInfo: true jest przekazywany w żądaniu');
    }
    
    if (!data || !data.script) {
      console.error('Brak wygenerowanego skryptu w odpowiedzi');
      toast.error('Brak wygenerowanego skryptu w odpowiedzi');
      return generateSampleScript(templateId);
    }
    
    console.log('✅ Skrypt został pomyślnie wygenerowany');
    return data.script;
  } catch (error) {
    console.error('Błąd generowania skryptu:', error);
    toast.error('Błąd podczas generowania skryptu');
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

## Przykładowe dialogi
- "Czy zauważyłeś, że [problem] staje się coraz większym wyzwaniem?"
- "Nasz produkt pozwala na [korzyść] bez konieczności [negatywny aspekt konkurencji]"
- "W ciągu ostatnich 6 miesięcy pomogliśmy ponad 100 klientom osiągnąć [rezultat]"

## Zakończenie
Dziękujemy za skorzystanie z naszego generatora skryptów! Możesz teraz dostosować ten szkic do swoich potrzeb.

UWAGA: To jest przykładowy skrypt wygenerowany z powodu błędu połączenia z API OpenAI.`;
};
