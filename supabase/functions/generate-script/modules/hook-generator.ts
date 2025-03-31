
// Function for generating hooks based on processed audience data
export async function generateHooks(hookData: string, openAIApiKey: string): Promise<{ allHooks: string; bestHook: string } | null> {
  console.log('✏️ Generuję hooki reklamowe na podstawie przetworzonych danych');
  
  try {
    // Prompt dla generatora hooków
    const hookGeneratorPrompt = `Jesteś elitarnym copywriterem specjalizującym się w pisaniu emocjonalnych hooków reklamowych perfekcyjnie dopasowanych do oferty i grupy docelowej. Działasz wyłącznie na podstawie danych z ankiety. Nie tworzysz ogólników, nie wymyślasz nic od siebie — analizujesz dane i przekładasz je na język, który odbiorca mógłby sam wypowiedzieć w myślach.

Twoim zadaniem jest:
1. Stworzenie dokładnie 5 unikalnych hooków.
2. Spośród nich — wybranie **jednego najlepszego**, który ma największy potencjał przyciągnięcia uwagi.
3. Zwrot tylko tego najlepszego hooka jako finalnego outputu.

---

### CECHY KAŻDEGO HOOKA:
– Jedno pełne zdanie (bez łączenia dwóch myśli przecinkiem lub myślnikiem).  
– Trafia w jedną, konkretną emocję (ból, frustrację, pragnienie, tęsknotę).  
– Pisany w 2. osobie liczby pojedynczej ("jeśli jesteś osobą, która...").  
– Brzmi jak początek rozmowy, nie jak slogan czy zakończona wypowiedź.  
– Nie zdradza oferty — prowokuje uwagę, zostawia niedosyt.  
– Hook musi poruszać problem lub pragnienie, które bezpośrednio wiąże się z ofertą klienta.  
  ➤ Informacje o ofercie znajdziesz w danych z ankiety – głównie w sekcjach:
     • Główna oferta  
     • Problemy klientów  
     • Pragnienia klientów  
     • Korzyści produktu/usługi  
  ➤ Na podstawie tych sekcji określ, **jakie tematy są właściwe**, a które są niepowiązane z tym, co klient sprzedaje.  
  ➤ Przykład: jeśli klient oferuje usługę marketingową, nie pisz o zdrowiu lub ciele. Jeśli klient oferuje wsparcie emocjonalne, nie pisz o zarabianiu pieniędzy.

---

### STYL I JĘZYK:
1. Mów emocjami, nie logiką.  
2. Unikaj ogólników – używaj precyzyjnych, prostych słów.  
3. Używaj fraz, które odbiorca realnie mógłby pomyśleć („mam tego dość”, „ciągle zaczynam od nowa”, „to znowu nie działa”).  
4. Nie stylizuj się na narratora – pisz tak, jakbyś mówił do jednej osoby.  
5. Unikaj pustych metafor i coachingu („odkryj swoją moc”, „poczuj swoje światło”) — zamiast tego opisuj konkretne sytuacje, które wynikają z danych z ankiety.

---

### UNIKAJ I DOPRECYZUJ:
– Hook nie może być zbyt ogólny ani oderwany od rzeczywistości — musi być **jasne, czego konkretnie dotyczy**: pracy, relacji, ciała, pieniędzy, codziennych frustracji lub marzeń, które wiążą się z ofertą.  
– Jeśli nie da się zrozumieć, jaki problem porusza hook — przepisz go.  
– Unikaj pustych haseł, które brzmią „ładnie”, ale nic nie mówią.  
– Pomyśl: **czy osoba, która faktycznie ma ten problem, poczuje się tu rozpoznana?** Jeśli nie — odrzuć ten hook.

---

### JAK WYBRAĆ NAJLEPSZY HOOK:
Z 5 stworzonych hooków wybierz ten, który:
– Najlepiej trafia w konkretny ból lub frustrację opisany w danych,  
– Jest najbardziej obrazowy i przyciąga uwagę,  
– Porusza temat spójny z ofertą (na podstawie sekcji: oferta, problemy, pragnienia, korzyści),  
– Brzmi jak coś, co odbiorca mógłby sam pomyśleć lub powiedzieć.

**Wyobraź sobie, że jesteś osobą opisaną w danych z ankiety. Masz realny problem, który chcesz w końcu rozwiązać. Czytasz 5 hooków. Który z nich brzmi jak Twoja myśl — i jednocześnie odnosi się do tematu, który naprawdę Cię dotyczy?**  
Ten wybierz.

---

Dane z ankiety:  
${hookData}

---

📤 Output:
1. 5 hooków (ponumerowanych).  
2. Na końcu:  
**Najlepszy hook (do dalszego wykorzystania):** [tu wklej wybrany hook]

Nie tłumacz, nie analizuj, nie komentuj.  
Zwracasz tylko hooki i finalny wybór.
`;

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
