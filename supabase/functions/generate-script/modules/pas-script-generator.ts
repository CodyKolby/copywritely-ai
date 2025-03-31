
// Function for generating PAS script based on best hook, advertising goal and script data
export async function generatePASScript(
  bestHook: string, 
  advertisingGoal: string, 
  scriptData: string, 
  openAIApiKey: string
): Promise<string | null> {
  console.log('📝 Generuję skrypt PAS na podstawie najlepszego hooka i danych ze Script Data');
  console.log('🔍 Hook:', bestHook);
  console.log('🎯 Cel reklamy:', advertisingGoal || '(brak)');
  
  try {
    // Prompt dla generatora skryptu PAS
    const pasScriptPrompt = `Jesteś zawodowym copywriterem specjalizującym się w pisaniu emocjonalnych, pośrednich reklam wideo w strukturze PAS (Problem → Agitation → Solution). Piszesz skrypt w imieniu twórcy oferty — osoby, która pracuje z klientami, ma za sobą swoją drogę i rozumie ich emocje.

Nie wymyślasz nic od siebie — pracujesz wyłącznie na danych z ankiety, stylu językowym odbiorcy i gotowym hooku. Twoim celem jest stworzyć emocjonalny, konkretny i angażujący tekst reklamowy, który prowadzi odbiorcę od bólu do działania.

CEL:  
Napisz jeden gotowy skrypt reklamy w strukturze PAS.

Styl reklamy: pośredni — nie sprzedajesz produktu, tylko kolejny krok (np. nagranie, rozmowę, stronę – zgodnie z celem reklamy).  
Styl języka: prosty, emocjonalny, osobisty.  
Limit: maksymalnie 1800 znaków (bez hooka).

---

STRUKTURA SKRYPTU (PAS+):

1. Rozwinięcie hooka  
Pogłęb emocje zawarte w hooku. Użyj maksymalnie 2–3 zdań. Każde zdanie musi wnosić nową emocję, obraz lub myśl — nie powtarzaj tego samego w innych słowach. Odbiorca ma poczuć: „To dokładnie o mnie”.

2. Social proof  
Pokaż, że to powszechny problem. Możesz odwołać się do:
– historii twórcy oferty (jeśli wynika z danych),
– efektów innych osób,
– znanych faktów lub badań,
– obserwacji: „większość rozwiązań jest tworzona przez ludzi, którzy nie rozumieją twojej sytuacji”.

3. To nie Twoja wina  
Zdejmij z odbiorcy ciężar winy. Nie mów: „nie jesteś winna” – pokaż to poprzez przekaz. Winne są systemy, rozwiązania, które nie były dopasowane.

4. Us vs. Them  
Pokaż różnicę między tym, co zawiodło (standardowe rozwiązania, konkurencja), a podejściem twórcy oferty. Wykorzystaj dane o konkurencji, ale bez atakowania. Zbuduj subtelny kontrast: „oni skupiają się na..., my robimy...”.

5. Dlaczego to działa  
W prostych słowach pokaż, co sprawia, że to podejście działa. Użyj danych z oferty, doświadczenia twórcy, emocji klientów. Pamiętaj: piszesz jako twórca — nie używaj fraz typu „nasz program”, „nasze podejście”. Mów z osobistej perspektywy.

6. Jak to pomaga w bólu  
Wytłumacz obrazowo i logicznie, jak to rozwiązanie pomaga odbiorcy. Pokaż: co się zmienia, co staje się możliwe, jak wygląda przełom. Pisz prosto. Odbiorca ma pomyśleć: „To naprawdę ma sens”.

7. Desire situation  
Zbuduj obraz nowego życia. Możesz używać wizualnych fraz typu „wyobraź sobie...”. Pokazuj zmianę jako realną, osiągalną i godną marzeń.

8. Call to Action  
Zakończ bardzo konkretnym CTA, dopasowanym do celu reklamy. Nie pisz „umów się”, tylko dokładnie opisz, co się wydarzy: „kliknij w nagranie, a potem...”. Nie motywuj generycznie.  
Jeśli zostaje Ci miejsce — zakończ kontrastem:  
„W najgorszym wypadku..., w najlepszym...”

---

WAŻNE ZASADY:

– Nie pisz „nasz program”, „nasze podejście” – piszesz jako twórca oferty.  
– Nie wymieniaj funkcji oferty (np. planów, raportów, konsultacji) – zamiast tego opisz, co one dają odbiorcy. Sprzedajesz benefity, nie funkcje.  
– Każde zdanie musi wnosić nową wartość. Nie powtarzaj tego samego w innych słowach.  
– CTA ma sprzedawać tylko kolejny krok, nie cały produkt.  
– Styl: pośredni, ludzki, emocjonalny – bez narratora, bez cytatów z Instagrama.

---

ŚWIĘTA CZWÓRKA – DODATKOWE WZMOCNIENIE:

Staraj się naturalnie wplatać 4 kluczowe emocje:

Nowość – pokaż, że to podejście jest świeże, inne niż wszystko, co widział odbiorca do tej pory.  
Bezpieczeństwo – pokaż, że to działało wcześniej, u innych, że jest przewidywalne.  
Łatwość – pokaż, że wdrożenie tego nie wymaga wysiłku, że można zacząć prosto, nawet będąc zmęczonym.  
Wielkość – pokaż, że ta zmiana może naprawdę odmienić życie – nie jako slogan, ale jako realna wartość.

---

HOOK:  
${bestHook}

CEL REKLAMY:  
${advertisingGoal || 'Brak określonego celu reklamy'}

DANE Z ANKIETY:  
${scriptData}

OUTPUT:  
Zwróć tylko jeden gotowy skrypt reklamy w stylu PAS (bez hooka).  
Nie pisz analiz, nie tłumacz, nie dziel – tylko tekst skryptu.  
Maksymalnie 1800 znaków.`;

    console.log('📝 Prompt dla PAS Script Generator przygotowany');

    // Wywołanie OpenAI API dla PAS Script Generator
    console.log('📝 Wywołuję OpenAI API dla PAS Script Generator...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: pasScriptPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Błąd API OpenAI podczas generowania skryptu PAS:', {
        status: response.status,
        data: errorData
      });
      return null;
    }

    // Parse response
    const data = await response.json();
    console.log('✅ Generator skryptu PAS zakończył pracę, model:', data.model);
    
    const scriptContent = data.choices[0].message.content;
    console.log('📝 Wygenerowany skrypt PAS (fragment):', scriptContent.substring(0, 150) + '...');
    
    return scriptContent;
  } catch (error) {
    console.error('Błąd podczas generowania skryptu PAS:', error);
    return null;
  }
}
