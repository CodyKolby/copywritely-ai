
// Function for preprocessing audience data - Agent 1: Data Processor
export async function preprocessAudienceData(audienceDescription: string, openAIApiKey: string): Promise<string | null> {
  console.log('🔄 Wykonuję preprocessing danych ankiety przez Data Processing Agent');
  
  try {
    // Prompt dla agenta przetwarzającego dane
    const dataProcessingPrompt = `
Jesteś specjalistą od przetwarzania danych marketingowych. Twoim zadaniem jest przetworzenie danych z ankiety na dwa konkretne zestawy: HOOK DATA i SCRIPT DATA.

ZASADY:
– Nie twórz treści marketingowych.  
– Usuwaj powtórzenia i nieistotne dygresje.  
– Zachowuj autentyczny język odbiorcy: cytaty, słowa-klucze, styl wypowiedzi.  
– Każdy punkt ma zawierać minimum 3–5 przykładów.  
– Jeśli coś jest tylko hasłem – dodaj 1 zdanie wyjaśnienia.  
– Dane będą używane przez inne AI — zadbaj o precyzję i kompletność.

---

## HOOK DATA

1. Główna oferta: 
1–2 zdania opisujące co, dla kogo, z jakim efektem.  

2. Grupa docelowa: 
Wiek, płeć, typ osoby, sposób życia (np. "kobiety 25–45 lat, z niską samooceną i problemami hormonalnymi").  

3. Problemy odbiorcy: 
Wypisz **minimum 5 problemów** w formacie:  
[Nazwa problemu] – [krótkie zdanie wyjaśniające, jak ten problem wygląda u odbiorcy]

Np.:
– Niska samoocena – odbiorca nie wierzy w siebie i unika kontaktów społecznych.  
– Zmęczenie – mimo snu i odpoczynku czuje brak energii i motywacji.  
– Zaburzenia hormonalne – nie rozumie, co się dzieje z jego ciałem i nastrojami.

4. Pragnienia odbiorcy: 
→ Wypisz **minimum 5 pragnień** w formacie:  
– [Nazwa pragnienia] – [krótkie zdanie opisujące, jak odbiorca chce się czuć lub co osiągnąć]

Np.:
– Poczucie kobiecości – chce znów czuć się atrakcyjna, lekka i pewna siebie.  
– Spokój – marzy o wewnętrznej równowadze bez ciągłego napięcia i stresu.  
– Zdrowe ciało – chce mieć więcej energii i nie odczuwać ciągłego zmęczenia.   

5. Styl językowy odbiorcy (min. 5 fraz + ton):
Wypisz najczęstsze cytaty i sposób mówienia.  
Opisz ton: np. emocjonalny, zmęczony, buntowniczy.  

6. Biografia odbiorcy (3–5 zdań):
Kim jest, z jakiego punktu startuje, co przeżyła, co próbowała.  

7. Przekonania do zbudowania lub złamania (min. 3):  
Wypisz jako komunikaty, np. "Dieta to nie kara, tylko forma troski o siebie".

---

## SCRIPT DATA

1. Główna oferta:  
1–2 zdania: co, dla kogo, z jakim efektem.

2. Elementy oferty:  
Wypisz min. 5 punktów w poniższym formacie:  
– [Nazwa elementu] – [krótkie wyjaśnienie, co to daje odbiorcy]  
Np.:  
– Plan treningowy – dopasowany do stylu życia i możliwości odbiorcy, bez presji.

3. Główne korzyści (min. 5): 
Rozbij na fizyczne, psychiczne, życiowe.

4. Dlaczego działa (min. 3 konkretne powody): 
Co wyróżnia ofertę, co wpływa na skuteczność, co daje zaufanie.

5. Problemy i pragnienia (rozbij wg kategorii, min. 3 w każdej):  
– Problemy fizyczne – [opis]  
– Problemy emocjonalne – [opis]  
– Pragnienia ciała – [opis]  
– Pragnienia życia – [opis]

6. Biografia odbiorcy (3–5 zdań):
Kim jest, co ją frustruje, co próbowała, co nie działało.

7. Styl językowy odbiorcy (min. 5 fraz/cytatów):  
Wypisz dokładne cytaty i typowe słownictwo.

8. Konkurencja (2–3 zdania):
Główne różnice + typowe błędy konkurencji.

9. Doświadczenie twórcy (2–3 zdania):  
Co daje zaufanie, co pokazuje, że ta osoba wie, co robi.
---
Output: tylko (HOOK DATA) i (SCRIPT DATA), w tej kolejności.  
Pisz w punktach, bez lania wody, bez opinii, bez streszczania za bardzo.

Oryginalne dane z ankiety:
${audienceDescription}
`;

    console.log('🔄 Prompt dla Data Processing Agent przygotowany:', dataProcessingPrompt.substring(0, 200) + '...');

    // Wywołanie OpenAI API dla Data Processing Agent
    console.log('🔄 Wywołuję OpenAI API dla Data Processing Agent...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: dataProcessingPrompt }
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Błąd API OpenAI podczas preprocessingu:', {
        status: response.status,
        data: errorData
      });
      return null;
    }

    // Parse response
    const data = await response.json();
    console.log('📝 Data Processing Agent zakończył pracę, model:', data.model);
    console.log('📝 Odpowiedź Data Processing Agent (fragment):', data.choices[0].message.content.substring(0, 200) + '...');
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Błąd podczas przetwarzania danych:', error);
    return null;
  }
}

// Extract HOOK DATA from processed data
export function extractHookData(processedData: string): string | null {
  try {
    // Find HOOK DATA section
    const hookDataStartIndex = processedData.indexOf('## HOOK DATA');
    if (hookDataStartIndex === -1) {
      console.error('Nie znaleziono sekcji HOOK DATA w przetworzonych danych');
      return null;
    }
    
    // Find SCRIPT DATA section that comes after HOOK DATA
    const scriptDataStartIndex = processedData.indexOf('## SCRIPT DATA', hookDataStartIndex);
    
    // Extract HOOK DATA section
    const hookDataSection = scriptDataStartIndex !== -1 
      ? processedData.substring(hookDataStartIndex, scriptDataStartIndex).trim()
      : processedData.substring(hookDataStartIndex).trim();
    
    console.log('Wyekstrahowano dane dla Hook Generatora (fragment):', hookDataSection.substring(0, 150) + '...');
    
    return hookDataSection;
  } catch (error) {
    console.error('Błąd podczas ekstrakcji HOOK DATA:', error);
    return null;
  }
}

// Extract SCRIPT DATA from processed data (for future use)
export function extractScriptData(processedData: string): string | null {
  try {
    // Find SCRIPT DATA section
    const scriptDataStartIndex = processedData.indexOf('## SCRIPT DATA');
    if (scriptDataStartIndex === -1) {
      console.error('Nie znaleziono sekcji SCRIPT DATA w przetworzonych danych');
      return null;
    }
    
    // Extract SCRIPT DATA section
    const scriptDataSection = processedData.substring(scriptDataStartIndex).trim();
    
    console.log('Wyekstrahowano dane dla Script Buildera (fragment):', scriptDataSection.substring(0, 150) + '...');
    
    return scriptDataSection;
  } catch (error) {
    console.error('Błąd podczas ekstrakcji SCRIPT DATA:', error);
    return null;
  }
}
