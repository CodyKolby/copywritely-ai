
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
    const pasScriptPrompt = `ROLA:
Jesteś zawodowym copywriterem, specjalizującym się w emocjonalnych, pośrednich reklamach wideo w strukturze PAS (Problem → Agitation → Solution).

CEL:
Na podstawie danych od klienta (styl językowy, ankieta, hook) napisz jeden pełny skrypt reklamy. Styl: osobisty, prosty, emocjonalny. Nie wymyślaj nic od siebie.

STRUKTURA SKRYPTU (PAS+) — zachowaj kolejność i limity
Maks. 1800 znaków (nie licząc hooka). Pisz jako twórca oferty.

1.Rozwinięcie hooka: Pogłęb myśl rozpoczętą w hooku — maks. 2–3 zdania. Każde zdanie powinno rozwijać konkretny aspekt emocji poruszonej w hooku. Nie parafrazuj, nie przeskakuj tematu — zostań w emocji i ją rozbuduj.

2.Social proof: Pokaż, że to powszechny problem. Możesz użyć historii twórcy lub klientów, obserwacji, znanych faktów.

3.To nie Twoja wina: Nie pisz wprost — pokaż przez przekaz, że zawiodły niedopasowane systemy.

4.Us vs. Them: Zbuduj subtelny kontrast między tym, co nie działało, a podejściem twórcy. Nie atakuj.

5.Dlaczego to działa: Wyjaśnij, co sprawia, że metoda działa — językiem twórcy, nie firmy.

6.Jak to pomaga w bólu: Obrazowo i prosto: co się zmienia, co staje się możliwe. Pokaż przełom, nie funkcje.

7.Desire situation: Zbuduj realny, emocjonalny obraz nowego życia. Dodaj 2 akapity, zanim przejdziesz do CTA.

Call to Action: Zakończ konkretnym CTA prowadzącym do jednego kroku (np. obejrzenie wideo, konsultacja). Na koniec dodaj kontrast: „W najgorszym… W najlepszym…”

WAŻNE ZASADY:
– Pisz jako twórca, nie mów „nasz program”.
– Nie wymieniaj funkcji — pokazuj, co dają odbiorcy.
– Nie powtarzaj emocji i myśli w różnych słowach.
– Nie pisz cytatów, nie stosuj narratora.
– Styl: prosty, prawdziwy, emocjonalny.
– Nie zakładaj, że odbiorca czuje się w określony sposób. Zadawaj pytania lub stosuj warunkowe sformułowania: „Być może...”, „Czy zdarza Ci się...?”, „Możesz czuć, że...”.
– Nie opisuj funkcji oferty („plan”, „konsultacja”, „ćwiczenia”, „moduły”, „narzędzie”). Zawsze pokazuj, co dzięki temu odbiorca czuje, robi lub zyskuje. Myśl: funkcja → efekt emocjonalny.
– Dbaj o płynność między sekcjami. Każdy fragment powinien wynikać logicznie i emocjonalnie z poprzedniego, tworząc naturalny flow — nie urywaj wątków, nie przeskakuj nagle do kolejnej części.
– Pisz językiem polskim — naturalnym, potocznym, emocjonalnym. Unikaj dosłownych tłumaczeń z angielskiego („a ja sama...”, „nie jesteś sama w tym...”). Zwróć uwagę na melodię polskich zdań: mówisz do kogoś, kto ma to usłyszeć, nie przeczytać w książce.
– Każda reklama powinna być osadzona w temacie konkretnej oferty. Nie pisz ogólnie o zmęczeniu, ciele czy frustracji — używaj języka i emocji, które są charakterystyczne dla danego typu programu, produktu lub usługi.

INSTRUKCJA STYLU PISANIA:

Pisz skrypty tak, jakbyś rozmawiał/a z jedną osobą — empatycznie, bez patosu, bez mentorskiego tonu. Nie użyj fraz motywacyjnych, ogólników, wielkich metafor ani haseł rodem z coachingu.

Oto jak to ma brzmieć:

Prawdziwie i ludzko. Tak, jakby twórca znał ból odbiorcy z własnego doświadczenia, nie z teorii.

Obrazowo. Używaj codziennych scen z życia, które każdy może poczuć. Zamiast „odzyskasz kontrolę”, napisz: „znów zjesz coś bez liczenia kalorii i nie poczujesz winy”.

Emocjonalnie, ale subtelnie. Unikaj dramatyzowania. Jedno mocne zdanie działa lepiej niż trzy przekombinowane.

W rytmie. Twoje zdania mogą być dłuższe, jeśli niosą emocje — ale pilnuj, by brzmiały naturalnie. Unikaj konstrukcji eseistycznych. Pisz tak, jak się mówi — z pauzami, przecinkami, naturalną melodią.

Bezpośrednio, ale z czułością. Nie oceniaj. Nie mów: „wiesz, że coś jest nie tak” — raczej: „czujesz, że coś się zmieniło”.

Taki styl ma być Twoim domyślnym stylem pisania reklam PAS. Nie rób „ładnych” tekstów. Rób prawdziwe.

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
