
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
    console.log('Czekam 3 sekundy, aby upewnić się, że dane są zapisane w bazie...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
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
    console.log('Przystępuję do generowania skryptu');
    
    // Bezpośrednie generowanie skryptu w oparciu o dane, bez odwoływania się do Edge Function
    // Ta implementacja zapobiega problemom z wywoływaniem Edge Function
    console.log('Generuję skrypt lokalnie zamiast wywoływać edge function');
    
    // Tworzymy skrypt w oparciu o dane grupy docelowej
    const script = generateLocalScript(templateId, audienceData);
    
    console.log('Skrypt został pomyślnie wygenerowany');
    return script;
  } catch (error) {
    console.error('Błąd generowania skryptu:', error);
    toast.error('Błąd podczas generowania skryptu');
    // Zwracamy przykładowy skrypt w przypadku błędu
    return generateSampleScript(templateId);
  }
};

/**
 * Generuje skrypt lokalnie na podstawie danych grupy docelowej
 * Jest to tymczasowe rozwiązanie zamiast wywoływania edge function
 */
const generateLocalScript = (templateId: string, audience: any): string => {
  let scriptTitle = "";
  
  switch(templateId) {
    case 'email':
      scriptTitle = "Email Marketingowy";
      break;
    case 'social':
      scriptTitle = "Post w Mediach Społecznościowych";
      break;
    case 'ad':
      scriptTitle = "Reklama";
      break;
    default:
      scriptTitle = "Skrypt Komunikacyjny";
  }
  
  // Pobierz podstawowe dane grupy docelowej
  const { 
    age_range = "Nie określono", 
    gender = "Nie określono",
    main_offer = "Nie określono",
    pains = [],
    desires = [],
    benefits = []
  } = audience;
  
  // Stwórz podstawowe sekcje skryptu
  let script = `# ${scriptTitle} dla grupy docelowej (${age_range}, ${gender})

## Główna oferta
${main_offer}

## Problemy klienta
${formatListItems(pains)}

## Pragnienia klienta
${formatListItems(desires)}

## Korzyści
${formatListItems(benefits)}

## Przykładowe komunikaty
`;

  // Dodaj przykładowe komunikaty na podstawie problemów i korzyści
  if (pains.length > 0 && benefits.length > 0) {
    script += `- "Czy męczy Cię ${pains[0] || 'ten problem'}? Nasza oferta zapewnia ${benefits[0] || 'konkretne korzyści'}!"\n`;
  }
  
  if (pains.length > 1 && benefits.length > 1) {
    script += `- "Przestań się martwić o ${pains[1] || 'te trudności'}. Dzięki nam zyskasz ${benefits[1] || 'wartość'}!"\n`;
  }
  
  script += `- "To rozwiązanie zostało stworzone specjalnie dla osób takich jak Ty!"\n`;
  
  // Dodaj wezwanie do działania
  script += `\n## Wezwanie do działania
- "Zamów teraz i otrzymaj specjalny bonus!"
- "Nie czekaj - liczba miejsc jest ograniczona!"
- "Dołącz już dziś i zacznij odczuwać rezultaty!"

---
Ten skrypt został wygenerowany lokalnie w aplikacji na podstawie podanych danych grupy docelowej.
Możesz go dostosować według własnych potrzeb.
`;

  return script;
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
Dziękujemy za skorzystanie z naszego generatora skryptów! Możesz teraz dostosować ten szkic do swoich potrzeb.`;
};
