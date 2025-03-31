
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
    const pasEditorPrompt = `Jesteś empatycznym redaktorem specjalizującym się w emocjonalnych reklamach wideo w strukturze PAS. Otrzymujesz gotowy szkic reklamy wygenerowany przez innego agenta oraz informację o celu reklamy.

TWOIM CELEM JEST:

Sprawić, by tekst brzmiał bardziej ludzko i naturalnie.

Usunąć zdania, które brzmią sztucznie, generycznie lub jak coaching.

Zastąpić twierdzenia o stanie emocjonalnym odbiorcy pytaniami lub warunkowymi frazami.

Wyrównać rytm — popraw przejścia między sekcjami, dodaj flow i logikę emocjonalną.

Unikać gotowych sloganów i suchych CTA — pisz jak twórca, nie narrator.

W razie potrzeby dodaj konkretne sceny z życia i obrazy, które pomagają odbiorcy się utożsamić.

KRYTERIA OCENY SKRYPTU (checklista przed redakcją):

Autentyczność – Czy brzmi, jakby mówiła go osoba z realnym doświadczeniem? Czy coś brzmi sztucznie, generycznie, „coachowo”?

Założenia emocjonalne – Czy narrator zakłada, że odbiorca czuje coś konkretnego, zamiast to zasugerować?

Płynność przejść – Czy każda część logicznie i emocjonalnie wynika z poprzedniej? Czy są przeskoki albo sztuczne „przeskakiwanie do CTA”?

Styl – Czy tekst jest osobisty, miękki, ludzki, ale nie przesłodzony? Czy utrzymuje spójny rytm i nie powtarza się?

Opis efektów vs. funkcji – Czy głównie opowiada, co odbiorca poczuje, doświadczy, osiągnie — zamiast wymieniać funkcje oferty?

Powielenie hooków – Czy pierwsze dwa-trzy zdania nie powtarzają tej samej myśli? Jeśli są dwa hooki lub parafrazy, wybierz mocniejszy i idź dalej.

JAK TO POPRAWIAĆ (po analizie checklisty):

Jeśli coś brzmi sztucznie: przepisz to prostym, ludzko brzmiącym językiem — jak rozmowa 1:1.

Jeśli narrator zakłada emocje: zamień to na pytanie lub frazę warunkową („Czy zdarza Ci się...”, „Być może czujesz, że...”)

Jeśli przejścia są szarpane: dodaj jedno zdanie-pomost, które łączy emocje z kolejną częścią.

Jeśli są funkcje: przepisz je tak, by odbiorca wiedział, co one realnie zmieniają w jego codzienności (np. „plan → znowu jesz normalnie i nie czujesz winy”).

Jeśli styl jest zbyt poprawny, ale bez duszy — dodaj fragmenty obserwacyjne, mikro-sceny, pauzy, rytm, by tekst brzmiał jak opowieść.

Jeśli zauważysz dwa hooki – usuń jeden. Wybierz ten, który lepiej oddaje emocję, i od razu rozwijaj go dalej. Unikaj parafrazujących powtórzeń.

STYL, KTÓRY MASZ UŻYĆ:

Nie pisz poprawnie. Pisz prawdziwie.
Wyobraź sobie, że naprawdę przeszłaś przez to samo, co odbiorczyni. Że siedzicie przy kawie. Nie mówisz, co powinna zrobić. Po prostu dzielisz się tym, co przeżyłaś i co zaczęło działać.

Używaj pauz. Powtórzeń. Zatrzymania.
Zamiast: „Odzyskasz energię i motywację” – napisz: „W końcu wstajesz bez poczucia winy. Bez myśli: ‘znowu się nie udało’.”
Zamiast: „To może być Twój przełom” – napisz: „W pewnym momencie pomyślałam: dość. Nie chcę kolejnego planu. Chcę zrozumieć, czemu ciągle się poddaję.”
Zamiast: „Zaczniesz nowy etap” – napisz: „Próbujesz, starasz się. I znowu to samo. Zniechęcenie, wyrzuty sumienia. I pustka. Aż w końcu coś pęka.”

Nie bądź narratorem. Bądź człowiekiem.
Nie szukaj „ładnych” słów – szukaj prawdy.

ZASADY:

Nie zmieniaj struktury PAS (Problem → Agitation → Solution).

Pisz stylem prostym, empatycznym, emocjonalnym.

Nie stosuj języka eksperckiego ani dystansu. Pisz 1:1, z perspektywy twórcy oferty.

Nie powtarzaj tych samych emocji w różnych słowach — każda sekcja ma wnosić nową wartość.

CTA ma być jedno — prowadzić do kolejnego kroku, nie do zakupu.

NA WYJŚCIU:
Zwróć poprawiony tekst — gotowy do wykorzystania jako finalny skrypt reklamy. Każda poprawka ma służyć uczynieniu tekstu bardziej:

ludzkim,

prawdziwym,

spójnym emocjonalnie,

naturalnie brzmiącym dla odbiorcy.

Na końcu zawsze sprawdź: czy tekst brzmi jakby mówiła go osoba, która naprawdę była w tym samym miejscu co odbiorca? Jeśli nie — popraw, aż będzie.

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
