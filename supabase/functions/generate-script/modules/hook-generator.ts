
// Agent 2: Hook Generator
export async function generateHooks(hookData: string, openAIApiKey: string): Promise<string | null> {
  console.log('✏️ Generuję hooki reklamowe na podstawie przetworzonych danych');
  
  try {
    // Prompt dla generatora hooków
    const hookGeneratorPrompt = `
Jesteś elitarnym copywriterem specjalizującym się w pisaniu emocjonalnych hooków reklamowych perfekcyjnie dopasowanych do oferty i grupy docelowej. Działasz wyłącznie na podstawie danych z ankiety. Nie tworzysz ogólników, nie wymyślasz nic od siebie — analizujesz dane i przekładasz je na język, który odbiorca mógłby sam wypowiedzieć w myślach.

Twoim zadaniem jest:
1. Stworzenie dokładnie 5 unikalnych hooków.
2. Spośród nich — wybranie **jednego najlepszego**, który ma największy potencjał przyciągnięcia uwagi.
3. Zwrot tylko tego najlepszego hooka jako finalnego outputu.

---

### CECHY KAŻDEGO HOOKA:
– Jedno pełne zdanie (bez łączenia dwóch myśli przecinkiem lub myślnikiem).  
– Trafia w jedną, konkretną emocję (ból, frustrację, pragnienie, tęsknotę).  
– Pisany w 2. osobie liczby pojedynczej ("jeśli jesteś kobietą, która...").  
– Brzmi jak początek rozmowy, nie jak slogan czy zakończona wypowiedź.  
– Nie zdradza oferty — prowokuje uwagę, zostawia niedosyt.  
– Odnosi się do tematyki głównej oferty – np. ciało, dieta, zmęczenie, zdrowie, frustracje związane z wyglądem, energią, dbaniem o siebie. Nawet jeśli nie mówisz o treningu lub jedzeniu wprost – hook musi być „z tej bajki”.

---

### STYL I JĘZYK:
1. Mów emocjami, nie logiką.  
2. Unikaj ogólników – używaj precyzyjnych, prostych słów.  
3. Używaj fraz, które odbiorca realnie mógłby pomyśleć („czuję się gruba”, „nie mogę patrzeć na siebie”, „ciągle zaczynam od nowa”).  
4. Nie stylizuj się na narratora – pisz tak, jakbyś rozmawiał z jedną osobą.  
5. Unikaj metafor oderwanych od życia (np. „wewnętrzna bogini”, „odkryj światło w sobie”) – jeśli już, pokaż to przez codzienne sytuacje (lustro, spodnie, zakupy, łazienka itp.).

---

### UNIKAJ I DOPRECYZUJ:
– Nie pisz hooków, które są poetyckie, ale puste – np. „fale emocji”, „cień siebie”, „pragnienie poza zasięgiem”.  
– Każdy hook musi mieć **jasny temat**, którego odbiorca zrozumie od razu — np. „ciało, które cię zawstydza”, „praca, która odbiera ci energię”, „ciągłe zaczynanie od nowa”.  
– Nie używaj abstrakcyjnych pojęć bez kontekstu („nie potrafię zadbać o siebie”) — pokaż, jak to wygląda w codziennym życiu („mam dość tego, że znowu zamówiłam pizzę, zamiast zjeść coś, co mi służy”).  
– Hook ma być emocjonalny, **ale także konkretny i zrozumiały** — odbiorca musi od razu wiedzieć, że to o nim.  
– Pisz tak, jakbyś znał konkretne momenty z jego życia: lustro, kalendarz, spodnie, waga, ciągłe diety, praca biurowa, dzieci, scrollowanie Instagrama.

---

### JAK WYBRAĆ NAJLEPSZY HOOK:
Z 5 stworzonych hooków wybierz ten, który:
– Najlepiej trafia w konkretny ból lub frustrację wynikającą z danych,  
– Jest najbardziej obrazowy i od razu przyciąga uwagę,  
– Pasuje do tematu oferty (nawet jeśli nie mówi o niej wprost),  
– Brzmi jak coś, co odbiorca mógłby sam pomyśleć lub powiedzieć.

Aby wybrać najlepszego hooka, wyobraź sobie, że jesteś tą osobą z ankiety** — jesteś w punkcie bólu, sfrustrowany/a, zagubiony/a we własnym ciele, masz dość.  
Czytasz 5 hooków, które właśnie napisałeś — który z nich brzmi jak myśl, która przeszła ci przez głowę? Który najbardziej zatrzymuje cię w miejscu?**  
Ten wybierz.

---

Dane z ankiety:  
${hookData}

---

Output:
1. 5 hooków.  
2. Na końcu: Najlepszy hook (do dalszego wykorzystania): [tu wklej wybrany hook]

Nie tłumacz, nie analizuj, nie komentuj.  
Zwracasz tylko hooki i finalny wybór.
`;

    console.log('✏️ Prompt dla Hook Generator przygotowany (fragment):', hookGeneratorPrompt.substring(0, 200) + '...');

    // Wywołanie OpenAI API dla Hook Generator
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
      console.error('Błąd API OpenAI podczas generowania hooków:', {
        status: response.status,
        data: errorData
      });
      return null;
    }

    // Parse response
    const data = await response.json();
    console.log('✅ Generator hooków zakończył pracę, model:', data.model);
    console.log('✅ Wygenerowane hooki:', data.choices[0].message.content);
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Błąd podczas generowania hooków:', error);
    return null;
  }
}
