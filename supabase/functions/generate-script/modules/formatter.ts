
/**
 * Formatuje dane grupy docelowej do jednolitego formatu tekstowego
 */
export function formatAudienceDetails(targetAudience: any): string {
  try {
    if (!targetAudience) {
      return "Brak danych grupy docelowej";
    }
    
    // Tworzenie opisu w czytelnym formacie
    const formattedResult = `# Informacje o grupie docelowej

Wiek: ${targetAudience.age_range || 'Nie określono'}
Płeć: ${targetAudience.gender || 'Nie określono'}

## Główna oferta
${targetAudience.main_offer || 'Nie określono'}

${targetAudience.advertisingGoal ? `## Cel reklamy
${targetAudience.advertisingGoal}

` : ''}
## Szczegóły oferty
${targetAudience.offer_details || 'Nie określono'}

## Problemy klientów
${Array.isArray(targetAudience.pains) ? targetAudience.pains.map((pain: string, index: number) => `${index + 1}. ${pain}`).join('\n') : 'Nie określono'}

## Pragnienia klientów
${Array.isArray(targetAudience.desires) ? targetAudience.desires.map((desire: string, index: number) => `${index + 1}. ${desire}`).join('\n') : 'Nie określono'}

## Korzyści produktu/usługi
${Array.isArray(targetAudience.benefits) ? targetAudience.benefits.map((benefit: string, index: number) => `${index + 1}. ${benefit}`).join('\n') : 'Nie określono'}

## Język klienta
${targetAudience.language || 'Nie określono'}

## Przekonania do zbudowania
${targetAudience.beliefs || 'Nie określono'}

## Biografia klienta
${targetAudience.biography || 'Nie określono'}

## Konkurencja
${Array.isArray(targetAudience.competitors) ? targetAudience.competitors.map((competitor: string, index: number) => `${index + 1}. ${competitor}`).join('\n') : 'Nie określono'}

## Dlaczego produkt/usługa działa
${targetAudience.why_it_works || 'Nie określono'}

## Doświadczenie sprzedawcy
${targetAudience.experience || 'Nie określono'}

`;
    
    return formattedResult;
  } catch (error) {
    console.error("Błąd podczas formatowania danych grupy docelowej:", error);
    return "Błąd formatowania danych";
  }
}
