
// Function for editing PAS script to make it more natural and human-like
export async function editPASScript(
  script: string,
  advertisingGoal: string,
  openAIApiKey: string
): Promise<string | null> {
  console.log('✏️ Redagowanie skryptu PAS przez Redaktora PAS');
  console.log('🎯 Cel reklamy:', advertisingGoal || '(brak)');
  console.log('📝 Skrypt do redakcji (fragment):', script.substring(0, 150) + '...');
  
  try {
    // Prompt dla edytora skryptu PAS
    const pasEditorPrompt = `Jesteś empatycznym redaktorem specjalizującym się w emocjonalnych reklamach wideo w strukturze PAS. Otrzymujesz gotowy szkic reklamy wygenerowany przez innego agenta.

TWOIM CELEM JEST:
– Sprawić, by tekst brzmiał bardziej ludzko i naturalnie.
– Usunąć zdania, które brzmią sztucznie, generycznie lub jak coaching.
– Zastąpić twierdzenia o stanie emocjonalnym odbiorcy pytaniami lub warunkowymi frazami.
– Wyrównać rytm — popraw przejścia między sekcjami, dodaj flow i logikę emocjonalną.
– Unikać gotowych sloganów i suchych CTA — pisz jak twórca, nie narrator.
– W razie potrzeby dodaj konkretne sceny z życia i obrazy, które pomagają odbiorcy się utożsamić.

ZASADY:
– Nie zmieniaj struktury PAS (Problem → Agitation → Solution).
– Pisz stylem prostym, empatycznym, emocjonalnym.
– Nie stosuj języka eksperckiego ani dystansu. Pisz 1:1, z perspektywy twórcy oferty.
– Nie powtarzaj tych samych emocji w różnych słowach — każda sekcja ma wnosić nową wartość.
– CTA ma być jedno — prowadzić do kolejnego kroku, nie do zakupu.

NA WYJŚCIU:
Zwróć poprawiony tekst — gotowy do wykorzystania jako finalny skrypt reklamy. Każda poprawka ma służyć uczynieniu tekstu bardziej:
– ludzkim,
– prawdziwym,
– spójnym emocjonalnie,
– naturalnie brzmiącym dla odbiorcy.

SKRYPT DO ZREDAGOWANIA:
${script}

CEL REKLAMY:
${advertisingGoal || 'Brak określonego celu reklamy'}

OUTPUT:
Zwróć tylko gotowy, zredagowany skrypt reklamy.
Nie pisz analiz, nie tłumacz — tylko finalny tekst.
Maksymalnie 1800 znaków.`;

    console.log('✏️ Prompt dla Redaktora PAS przygotowany');

    // Wywołanie OpenAI API dla PAS Script Editor
    console.log('✏️ Wywołuję OpenAI API dla Redaktora PAS...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: pasEditorPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Błąd API OpenAI podczas edycji skryptu PAS:', {
        status: response.status,
        data: errorData
      });
      return null;
    }

    // Parse response
    const data = await response.json();
    console.log('✅ Redaktor PAS zakończył pracę, model:', data.model);
    
    const editedScript = data.choices[0].message.content;
    console.log('📝 Zredagowany skrypt PAS (fragment):', editedScript.substring(0, 150) + '...');
    
    return editedScript;
  } catch (error) {
    console.error('Błąd podczas edycji skryptu PAS:', error);
    return null;
  }
}
