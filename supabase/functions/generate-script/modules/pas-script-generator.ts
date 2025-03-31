
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
    const pasScriptPrompt = `Jesteś zawodowym copywriterem specjalizującym się w pisaniu emocjonalnych, pośrednich reklam wideo w strukturze PAS (Problem → Agitation → Solution). Piszesz skrypt oparty o dane z ankiety, wybrany hook i cel reklamy. Twoje reklamy nie sprzedają od razu produktu – sprzedają tylko kolejny krok (np. rozmowę, nagranie, stronę, PDF – zgodnie z celem reklamy).

Nie wymyślasz nic od siebie — pracujesz wyłącznie na danych z ankiety, stylu językowym odbiorcy i gotowym hooku. Twoim celem jest stworzyć emocjonalny, konkretny i angażujący tekst reklamowy, który prowadzi odbiorcę od bólu do działania.

CEL:
Napisz jeden gotowy skrypt reklamy w strukturze PAS, zawierający wszystkie najważniejsze elementy reklamy emocjonalnej.

Styl: pośredni. Nie sprzedajesz produktu. Sprzedajesz tylko kolejny krok, na podstawie celu reklamy.  
Maksymalna długość: 1800 znaków (bez hooka).  
Styl języka: prosty, emocjonalny, ludzki – dopasowany do języka odbiorcy.

STRUKTURA SKRYPTU (PAS+)
Pisz płynnie, bez numerowania, ale pamiętaj o tej kolejności i funkcji każdej części:

1. Rozwinięcie hooka – Pogłęb emocje zawarte w hooku. Użyj 2–3 zdań, które pokazują, że dokładnie rozumiesz, przez co przechodzi odbiorca. Nazwij jego doświadczenia, codzienne zmagania, błędne koła, emocje. Ma pomyśleć: „To dokładnie o mnie".

2. Social proof – Pokaż, że sytuacja odbiorcy nie jest odosobniona. Wykorzystaj jeden z poniższych sposobów:  
- własną drogę twórcy oferty (jeśli wynika to z danych)  
- efekty innych klientów  
- znane fakty lub badania  
- stwierdzenia pokazujące, że większość rozwiązań jest projektowana dla ludzi zupełnie innych niż on  
Przekaz: „To powszechny problem. Nie jesteś sam/a. System zawiódł – nie Ty."

3. To nie Twoja wina – Zdejmij z odbiorcy ciężar winy. Pokaż, że wcześniej zawiodły systemy, nie on sam. Ma poczuć ulgę i nowe otwarcie: „Może jednak nie jestem zepsuta/y".

4. Us vs. Them – Pokaż kontrast między tym, co zawiodło (standardowe rozwiązania, konkurencja), a tym, co proponuje Twój klient. Możesz korzystać z sekcji "konkurencja" z danych ankiety, by pokazać realne przewagi tej oferty. Pokaż różnicę w podejściu, wartościach, skuteczności – subtelnie, bez hejtu.

5. Dlaczego nasze podejście działa – W prostych słowach pokaż, co sprawia, że ta oferta naprawdę działa. Skorzystaj z danych takich jak:  
- doświadczenie osoby, która stworzyła tę ofertę  
- liczba klientów / praktyka  
- konkretne elementy oferty  
- kluczowe bóle i potrzeby odbiorcy

6. Jak to pomaga w bólu – Wytłumacz logicznie i obrazowo, jak to rozwiązanie redukuje ból odbiorcy. Opisz prosto: co się zmieni, dlaczego to ma sens, jak to wygląda w praktyce. Klient ma pomyśleć: „Rozumiem. To może naprawdę zadziałać".

7. Desire situation – Pokaż obraz nowego życia. Użyj wizualnych fraz („wyobraź sobie, że...", „jakby to było, gdybyś..."), ale nie przesadzaj. Ma być ciepło, realistycznie i inspirująco.

8. Call to Action – Sprzedajesz tylko kolejny krok. Opisz go bardzo konkretnie: co odbiorca ma zrobić, co się stanie po kliknięciu, czego może się spodziewać. Nie pisz ogólnikowo.

9. W najgorszym wypadku / w najlepszym... (opcjonalnie) – Jeśli zostaje Ci miejsce: zakończ kontrastem. Pokaż, że nawet jeśli się nie zdecyduje – zyska coś. A jeśli tak – może zmienić życie.

ŚWIĘTA CZWÓRKA – DODATKOWE WSKAZÓWKI:
Staraj się w naturalny sposób wplatać w tekst cztery kluczowe emocje: Nowość, Bezpieczeństwo, Łatwość, Wielkość – tzw. "Świętą Czwórkę". To one budują zaufanie, zainteresowanie i decyzję.

NOWOŚĆ  
Używaj nowości, by odbiorca poczuł, że ma do czynienia z czymś całkowicie innym niż wszystko, co widział wcześniej. Reklama ma dawać powiew świeżości – coś innego niż kolejne "rozwiązanie z Internetu".  
Słowa: nowy, autorski, przełomowy, zmieniający zasady gry, nigdy wcześniej, pierwszy raz, świeże podejście.

BEZPIECZEŃSTWO  
Zbuduj poczucie, że rozwiązanie jest sprawdzone, powtarzalne i przewidywalne. Pokaż, że efekty, które obiecujesz, są zgodne z tym, co już miało miejsce.  
Frazy: widziałam to u dziesiątek osób, za każdym razem gdy robimy X, dzieje się Y, historia się powtarza, to rozwiązanie przeszło przez setki przypadków.

ŁATWOŚĆ  
Pokaż, że wdrożenie tego rozwiązania nie wymaga ogromnego wysiłku ani wiedzy eksperckiej.  
Frazy: proste, każdy może, wystarczy, nie musisz, krok po kroku, bez spiny, nawet jeśli próbowałaś wszystkiego.

WIELKOŚĆ  
Pokaż, że to, co oferujesz, może mieć realny wpływ na całe życie odbiorcy. Nie chodzi o przesadę, tylko o pokazanie, że to nie jest kolejna opcja – tylko realna szansa na zmianę.  
Pokaż: co się wydarzy dalej, benefit benefitu, jak wiele może się zmienić.

DANE WEJŚCIOWE:

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
