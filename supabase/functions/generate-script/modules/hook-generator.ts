
// Function for generating hooks based on processed audience data
export async function generateHooks(hookData: string, openAIApiKey: string): Promise<{ allHooks: string; bestHook: string } | null> {
  console.log('✏️ Generuję hooki reklamowe na podstawie przetworzonych danych');
  
  try {
    // Prompt dla generatora hooków
    const hookGeneratorPrompt = `Jesteś elitarnym copywriterem specjalizującym się w pisaniu emocjonalnych hooków reklamowych perfekcyjnie dopasowanych do oferty i grupy docelowej. Działasz wyłącznie na podstawie danych z ankiety. Nie wymyślasz nic od siebie – nie dodajesz wiedzy, której nie ma w danych.

CEL:
1. Napisz 5 różnych hooków reklamowych (otwierających pytań lub stwierdzeń) do maks. 120 znaków każdy, które przyciągają uwagę i pokazują, że rozumiesz odbiorcę.

2. Wybierz jeden najlepszy hook z tych pięciu i oznacz go jako "Najlepszy hook (do dalszego wykorzystania):"

WSKAZÓWKI:
- Twórz pytania otwierające lub stwierdzenia, które natychmiast przyciągają uwagę – maksymalnie 120 znaków.
- Najlepsze hooki bazują na emocjach, frustracjach, pragnieniach i najgłębszych potrzebach odbiorcy.
- Odwołuj się do kluczowego bólu lub pragnienia – używaj dokładnych słów i zwrotów z sekcji „Styl językowy odbiorcy".
- Używaj drugiej osoby („Ty", „Twoje"), buduj osobistą relację.
- Uwzględnij doświadczenia codziennego życia odbiorcy.
- Pytania i stwierdzenia powinny być proste, jednoznaczne i konkretne.
- Pokaż, że rozumiesz odbiorcę.

DANE Z ANKIETY:
${hookData}

OUTPUT:
Zwróć listę 5 hooków reklamowych, każdy w nowej linii, oddzielonych numerami.
Na koniec wskaż najlepszy hook.`;

    console.log('✏️ Prompt dla Hook Generator przygotowany (fragment):', hookGeneratorPrompt.substring(0, 150) + '...');

    // Wywołanie OpenAI API
    console.log('✏️ Wywołuję OpenAI API dla Hook Generator...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: hookGeneratorPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Błąd API OpenAI podczas generowania hooków:', errorData);
      return null;
    }

    // Parse response
    const data = await response.json();
    console.log('✅ Generator hooków zakończył pracę, model:', data.model);
    
    const hooksText = data.choices[0].message.content;
    console.log('✅ Wygenerowane hooki:', hooksText);
    
    // Extract the best hook from the text
    const bestHookMatch = hooksText.match(/Najlepszy hook \(do dalszego wykorzystania\): (.*?)(?:\n|$)/);
    let bestHook = '';
    
    if (bestHookMatch && bestHookMatch[1]) {
      bestHook = bestHookMatch[1].trim();
    } else {
      // Fallback: if no explicit best hook, use the first one
      const firstHookMatch = hooksText.match(/1\.\s*(.*?)(?:\n|$)/);
      if (firstHookMatch && firstHookMatch[1]) {
        bestHook = firstHookMatch[1].trim();
      }
    }
    
    console.log('✅ Wyekstrahowany najlepszy hook:', bestHook);
    
    return {
      allHooks: hooksText,
      bestHook: bestHook
    };
  } catch (error) {
    console.error('Błąd podczas generowania hooków:', error);
    return null;
  }
}
