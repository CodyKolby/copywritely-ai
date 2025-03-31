
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
Pogłęb emocje — maks. 2–3 zdania. Każde wnosi nową emocję lub myśl. Nie parafrazuj, nie powtarzaj.

2. Social proof  
Pokaż, że to powszechny problem. Możesz użyć historii twórcy lub klientów, obserwacji, znanych faktów.

3. To nie Twoja wina  
Zdejmij z odbiorcy ciężar winy. Nie pisz wprost, pokaż przez przekaz, że zawiodły niedopasowane systemy.

4. Us vs. Them  
Pokaż różnicę między tym, co zawiodło (standardowe rozwiązania, konkurencja), a podejściem twórcy oferty. Wykorzystaj dane o konkurencji, ale bez atakowania.

5. Dlaczego to działa  
Wyjaśnij, co sprawia, że metoda działa — językiem twórcy, nie firmy.

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
– Pisz jako twórca, nie mów „nasz program”.– Nie wymieniaj funkcji — pokazuj, co dają odbiorcy.
– Nie powtarzaj emocji i myśli w różnych słowach.
– Nie pisz cytatów, nie stosuj narratora.
– Styl: prosty, prawdziwy, emocjonalny.

Pisz skrypty tak, jakbyś rozmawiał/a z jedną osobą — empatycznie, bez patosu, bez mentorskiego tonu. Nie użyj fraz motywacyjnych, ogólników, wielkich metafor ani haseł rodem z coachingu.

Oto jak to ma brzmieć:

Prawdziwie i ludzko. Tak, jakby twórca znał ból odbiorcy z własnego doświadczenia, nie z teorii.

Obrazowo. Użyj codziennych scen z życia, które każdy może poczuć. Zamiast „odzyskasz kontrolę”, napisz: „znów zjesz coś bez liczenia kalorii i nie poczujesz winy”.

Emocjonalnie, ale subtelnie. Unikaj dramatyzowania. Jedno mocne zdanie działa lepiej niż trzy przekombinowane.

W rytmie. Dobrze brzmiące zdania to te, które mają flow. Nie rób bloków tekstu — użyj pauz, powtórzeń z sensem, kontrastu.

Bezpośrednio, ale z czułością. Nie oceniaj. Nie mów: „wiesz, że coś jest nie tak” — raczej: „czujesz, że coś się zmieniło”.

Taki styl ma być Twoim domyślnym stylem pisania reklam PAS.Nie rób „ładnych” tekstów. Rób prawdziwe.

---

ŚWIĘTA CZWÓRKA – DODATKOWE WZMOCNIENIE:

Staraj się naturalnie wplatać 4 kluczowe emocje:

Nowość – Żeby to podkreślić używaj słów : "Przełomowy", "Rewolucyjny", "Nowy", itd.
Bezpieczeństwo – pokaż, że to działało wcześniej, u innych, że jest przewidywalne.  
Łatwość – Żeby to podkreślić używaj słów : "krok po kroku", "każdy ...", "przewidywalny", itd.
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
