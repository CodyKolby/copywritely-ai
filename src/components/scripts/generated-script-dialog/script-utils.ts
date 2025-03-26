
import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a script based on the template ID and target audience data
 */
export const generateScript = async (templateId: string, targetAudienceId: string): Promise<string> => {
  try {
    console.log('Generating script for template:', templateId);
    console.log('Target audience ID:', targetAudienceId);
    
    // First, fetch the target audience data
    const { data: targetAudience, error: audienceError } = await supabase
      .from('target_audiences')
      .select('*')
      .eq('id', targetAudienceId)
      .single();
    
    if (audienceError) {
      console.error('Error fetching target audience:', audienceError);
      throw new Error('Failed to fetch target audience data');
    }
    
    if (!targetAudience) {
      console.error('Target audience not found');
      throw new Error('Target audience not found');
    }
    
    // Call the Supabase Edge Function to generate the script
    const { data, error } = await supabase.functions.invoke('generate-script', {
      body: {
        templateId,
        targetAudience,
      },
    });
    
    if (error) {
      console.error('Error generating script:', error);
      throw new Error('Failed to generate script');
    }
    
    if (!data || !data.script) {
      console.error('No script generated');
      throw new Error('No script was generated');
    }
    
    return data.script;
  } catch (error) {
    console.error('Script generation error:', error);
    // Return a fallback script for now
    return generateSampleScript(templateId);
  }
};

/**
 * Generates a sample script based on the template ID
 * This is a fallback in case the API call fails
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
