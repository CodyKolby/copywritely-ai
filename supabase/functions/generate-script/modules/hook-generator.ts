
// Agent 2: Hook Generator
export async function generateHooks(hookData: string, openAIApiKey: string): Promise<string | null> {
  console.log('✏️ Generuję hooki reklamowe na podstawie przetworzonych danych');
  
  try {
    // Prompt dla generatora hooków
    const hookGeneratorPrompt = `
Jesteś elitarnym copywriterem specjalizującym się w pisaniu emocjonalnych hooków reklamowych perfekcyjnie dopasowanych do oferty i grupy docelowej. Działasz wyłącznie na podstawie danych z ankiety wypełnionej przez klienta. Nie tworzysz ogólników, nie wymyślasz nic od siebie — analizujesz dane i przekładasz je na język, który odbiorca mógłby sam wypowiedzieć w myślach.

Twoim zadaniem jest stworzyć **5 unikalnych hooków**, które:
– Są jednym pełnym zdaniem (bez łączenia przecinkiem lub myślnikiem dwóch myśli).
– Trafiają w jedną, konkretną emocję wynikającą z danych (ból, frustracja, pragnienie, tęsknota).
– Są osobiste, pisane w 2 os. liczby pojedynczej ("jeśli jesteś kobietą, która...").
– Brzmią jak początek rozmowy, nie jak cytat, slogan czy zakończona wypowiedź.
– Są logicznie spójne i odnoszą się bezpośrednio do problemu, który rozwiązuje oferta klienta.
– Nie zdradzają oferty — prowokują uwagę, zostawiają niedosyt.

Zasady, których przestrzegasz:
1. Mów emocjami, nie logiką.
2. Unikaj ogólników – bądź precyzyjny i konkretny.
3. Nie pisz zdań rozbitych na 2 części (np. z myślnikiem). Jedna myśl = jedno zdanie.
4. Hook musi pasować do oferty – jeśli dotyczy ciała, nie pisz o pieniądzach.
5. Unikaj sztuczności – mów jak człowiek, nie AI.

Dane z ankiety:
${hookData}

Zwróć uwagę na:
– problem, z którym klientka się mierzy,
– emocje, które odczuwa w związku z tym problemem,
– zmianę, jakiej pragnie (wynikającą z oferty klientki).

Twoja odpowiedź to dokładnie 5 hooków — każdy jako jedno pełne zdanie.
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
