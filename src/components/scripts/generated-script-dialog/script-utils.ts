
import { supabase } from '@/integrations/supabase/client';
import { generateHooksAndAngles, generateScriptContent, finalizeScript } from './ai-agents-service';

/**
 * Generuje skrypt na podstawie ID szablonu i danych grupy docelowej,
 * wykorzystując system agentów AI
 */
export const generateScript = async (templateId: string, targetAudienceId: string): Promise<string> => {
  try {
    console.log('Generowanie skryptu dla szablonu:', templateId);
    console.log('ID grupy docelowej:', targetAudienceId);
    
    // Krok 1: Generowanie hooków i angles przez pierwszego agenta AI
    const hooksResponse = await generateHooksAndAngles(targetAudienceId, templateId);
    console.log('Wygenerowane hooki i angles:', hooksResponse);
    
    // Na razie, dla pierwszego etapu implementacji, zwracamy tylko wygenerowane hooki
    // W przyszłości będziemy tutaj wywoływać kolejne agenty
    
    // Formatowanie wyniku do tekstu Markdown
    let result = `# Hooki i angles wygenerowane dla szablonu: ${templateId}\n\n`;
    
    hooksResponse.hooks.forEach((item, index) => {
      result += `## Hook ${index + 1} (typ: ${item.type})\n`;
      result += `**${item.hook}**\n\n`;
      result += `**Angle:** ${item.angle}\n\n`;
    });
    
    result += `\n*W kolejnych etapach implementacji, wybrane hooki będą wykorzystane do wygenerowania pełnego skryptu.*`;
    
    return result;
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
