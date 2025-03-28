
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Configuration for the Edge Function
const SUPABASE_PROJECT_ID = 'jorbqjareswzdrsmepbv';
const EDGE_FUNCTION_URL = `https://${SUPABASE_PROJECT_ID}.functions.supabase.co/generate-script`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Generuje skrypt na podstawie ID szablonu i danych grupy docelowej
 */
export const generateScript = async (templateId: string, targetAudienceId: string): Promise<string> => {
  try {
    console.log('Generowanie skryptu dla szablonu:', templateId);
    console.log('ID grupy docelowej:', targetAudienceId);
    console.log('v1.6.0 - Naprawiony bug z debugInfo - zapewnienie wyświetlania wszystkich danych prompta');
    
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
    
    // Pobieramy token autoryzacyjny z sesji
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token || '';
    
    console.log('Wywołuję funkcję Edge przez bezpośredni HTTP request na URL PRODUKCYJNY:', EDGE_FUNCTION_URL);
    console.log('Authorization token dostępny:', accessToken ? 'Tak' : 'Nie');
    
    // Wykonujemy bezpośrednie zapytanie HTTP do Edge Function
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        templateId,
        targetAudienceId,
        debugInfo: true // Zawsze ustawione na true aby otrzymać dane debug
      }),
    });
    
    // Sprawdzamy status odpowiedzi
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Błąd podczas wywoływania Edge function:', response.status, errorText);
      toast.error('Błąd podczas generowania skryptu');
      return generateSampleScript(templateId);
    }
    
    // Parsujemy odpowiedź
    const data = await response.json();
    console.log('Odpowiedź z edge function:', data);
    
    // Wyświetlamy w konsoli przeglądarki pełny prompt wysłany do OpenAI
    if (data && data.debug) {
      console.log('%c 🔍 PEŁNE DANE WYSŁANE DO OPENAI:', 'background: #3498db; color: white; font-size: 12px; font-weight: bold; padding: 2px 5px; border-radius: 2px;');
      
      console.log('%c ====== SYSTEM PROMPT ======', 'background: #2ecc71; color: white; font-weight: bold;');
      console.log(data.debug.systemPrompt);
      
      console.log('%c ====== USER PROMPT (Dane o grupie docelowej) ======', 'background: #e74c3c; color: white; font-weight: bold;');
      console.log(data.debug.userPrompt);
      
      console.log('%c ====== PEŁNA STRUKTURA WIADOMOŚCI ======', 'background: #9b59b6; color: white; font-weight: bold;');
      console.log(data.debug.fullPrompt);
      
      console.log('%c ====== ODPOWIEDŹ OPENAI ======', 'background: #f39c12; color: white; font-weight: bold;');
      console.log(data.debug.response);
    } else {
      console.warn('Brak danych debug w odpowiedzi - sprawdź czy parametr debugInfo: true jest przekazywany w żądaniu');
    }
    
    if (!data || !data.script) {
      console.error('Brak wygenerowanego skryptu w odpowiedzi');
      toast.error('Brak wygenerowanego skryptu w odpowiedzi');
      return generateSampleScript(templateId);
    }
    
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
