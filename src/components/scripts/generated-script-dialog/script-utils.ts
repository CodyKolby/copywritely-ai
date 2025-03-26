
import { supabase } from '@/integrations/supabase/client';
import { generateHooksAndAngles, generateScriptContent, finalizeScript, HookAndAngle } from './ai-agents-service';

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
    
    if (!hooksResponse.hooks || hooksResponse.hooks.length === 0) {
      throw new Error('Nie wygenerowano żadnych hooków');
    }
    
    // Wybieramy pierwszy hook i angle do generowania skryptu
    // W przyszłości można dodać funkcję wyboru najlepszego hooka
    const selectedHook = hooksResponse.hooks[0].hook;
    const selectedAngle = hooksResponse.hooks[0].angle;
    
    // Krok 2: Generowanie głównej treści skryptu
    const scriptContent = await generateScriptContent(targetAudienceId, templateId, selectedHook, selectedAngle);
    console.log('Wygenerowana treść skryptu');
    
    // Formatowanie wyniku do tekstu Markdown z dodanymi hookami i angles
    let result = `# Skrypt reklamowy dla szablonu: ${templateId}\n\n`;
    
    // Dodajemy wszystkie wygenerowane hooki
    result += `## Wygenerowane hooki i angles\n\n`;
    
    hooksResponse.hooks.forEach((item, index) => {
      result += `### Hook ${index + 1} (typ: ${item.type})\n`;
      result += `**${item.hook}**\n\n`;
      result += `**Angle:** ${item.angle}\n\n`;
    });
    
    // Dodajemy treść główną skryptu
    result += `## Treść główna\n\n`;
    result += scriptContent;
    
    // Dodajemy informację o wybranym hooku
    result += `\n\n## Użyty hook i angle do generowania treści\n\n`;
    result += `**Hook:** ${selectedHook}\n\n`;
    result += `**Angle:** ${selectedAngle}\n\n`;
    
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
