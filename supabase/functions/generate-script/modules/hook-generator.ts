// Function for generating hooks based on processed audience data
export async function generateHooks(hookData: string, openAIApiKey: string): Promise<{ allHooks: string; rankedHooks: string[] } | null> {
  console.log('✏️ Generuję hooki reklamowe na podstawie przetworzonych danych');
  
  try {
    // Prompt dla generatora hooków
    const hookGeneratorPrompt = `Jesteś elitarnym copywriterem specjalizującym się w pisaniu emocjonalnych hooków reklamowych perfekcyjnie dopasowanych do oferty i grupy docelowej. Działasz wyłącznie na podstawie danych z ankiety. Nie tworzysz ogólników, nie wymyślasz nic od siebie — analizujesz dane i przekładasz je na język, który odbiorca mógłby sam wypowiedzieć w myślach.

Twoim zadaniem jest:
1. Stworzenie dokładnie 5 unikalnych hooków.
2. Uszeregowanie ich od najlepszego (1) do najgorszego (5).
3. Zwrot wszystkich hooków z ich rankingiem.

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
3. Używaj fraz, które odbiorca realnie mógłby pomyśleć („mam tego dość", „ciągle zaczynam od nowa", „to znowu nie działa").  
4. Nie stylizuj się na narratora – pisz tak, jakbyś mówił do jednej osoby.  
5. Unikaj pustych metafor i coachingu („odkryj swoją moc", „poczuj swoje światło") — zamiast tego opisuj konkretne sytuacje, które wynikają z danych z ankiety.

---

### UNIKAJ I DOPRECYZUJ:
– Hook nie może być zbyt ogólny ani oderwany od rzeczywistości — musi być **jasne, czego konkretnie dotyczy**: pracy, relacji, ciała, pieniędzy, codziennych frustracji lub marzeń, które wiążą się z ofertą.  
– Jeśli nie da się zrozumieć, jaki problem porusza hook — przepisz go.  
– Unikaj pustych haseł, które brzmią „ładnie", ale nic nie mówią.  
– Pomyśl: **czy osoba, która faktycznie ma ten problem, poczuje się tu rozpoznana?** Jeśli nie — odrzuć ten hook.

---

### JAK OCENIAĆ HOOKI:
Uszereguj 5 stworzonych hooków od najlepszego (1) do najgorszego (5), kierując się tymi kryteriami:
– Najlepszym jest hook, który najlepiej trafia w konkretny ból lub frustrację opisany w danych.  
– Drugim w kolejności ten, który jest najbardziej obrazowy i przyciągający uwagę.  
– Kolejne hooki szereguj według spójności z ofertą i autentyczności.  
– Najniżej oceń hook, który jest najbardziej ogólny lub najmniej emocjonalny.

**Wyobraź sobie, że jesteś osobą opisaną w danych z ankiety. Masz realny problem, który chcesz w końcu rozwiązać. Czytasz 5 hooków. Który z nich brzmi jak Twoja myśl — i jednocześnie odnosi się do tematu, który naprawdę Cię dotyczy? Ten umieść najwyżej.**

---

Dane z ankiety:  
${hookData}

---

📤 Output:
Zwróć 5 ponumerowanych hooków, od najlepszego (1) do najgorszego (5).
Format:

1. [Najlepszy hook]
2. [Drugi najlepszy hook]
3. [Trzeci hook]
4. [Czwarty hook]
5. [Piąty hook]

Nie tłumacz, nie analizuj, nie komentuj.  
Zwracasz tylko ponumerowane hooki.
`;

    console.log('✏️ Prompt dla Hook Generator przygotowany');

    // Wywołanie OpenAI API z retry logic
    console.log('✏️ Wywołuję OpenAI API dla Hook Generator...');
    
    // Add retry logic for rate limit issues
    let attempts = 0;
    const maxAttempts = 5;
    let waitTime = 2000; // Start with 2 seconds wait
    
    while (attempts < maxAttempts) {
      try {
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

        if (response.status === 429) {
          // Rate limit hit
          console.log(`Rate limit hit, attempt ${attempts + 1}/${maxAttempts}. Waiting for ${waitTime/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          waitTime *= 2; // Exponential backoff
          attempts++;
          continue;
        }

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Błąd API OpenAI podczas generowania hooków:', errorData);
          
          if (attempts < maxAttempts - 1) {
            console.log(`Retrying, attempt ${attempts + 1}/${maxAttempts}`);
            attempts++;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            waitTime *= 1.5;
            continue;
          }
          
          return null;
        }

        // Parse response
        const data = await response.json();
        console.log('✅ Generator hooków zakończył pracę, model:', data.model);
        
        const hooksText = data.choices[0].message.content;
        console.log('✅ Wygenerowane hooki z rankingiem:', hooksText);
        
        // Extract the ranked hooks from the text
        const rankedHooks: string[] = [];
        
        // Extract hooks using regex to match lines that start with a number followed by a period
        const hookRegex = /^\d+\.\s+(.+)$/gm;
        let match;
        
        while ((match = hookRegex.exec(hooksText)) !== null) {
          if (match[1]) {
            rankedHooks.push(match[1].trim());
          }
        }
        
        console.log('✅ Wyekstrahowane hooki w kolejności rankingu:', rankedHooks);
        
        return {
          allHooks: hooksText,
          rankedHooks: rankedHooks
        };
      } catch (error) {
        console.error(`Błąd podczas generowania hooków (próba ${attempts + 1}/${maxAttempts}):`, error);
        
        if (attempts < maxAttempts - 1) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          waitTime *= 1.5;
          continue;
        }
        
        return null;
      }
    }
    
    console.error('Wszystkie próby generowania hooków zakończyły się niepowodzeniem');
    return null;
  } catch (error) {
    console.error('Błąd podczas generowania hooków:', error);
    return null;
  }
}
