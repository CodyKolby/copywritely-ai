
// Function for generating AIDA script based on best hook, advertising goal and script data
export async function generateAIDAScript(
  bestHook: string, 
  advertisingGoal: string, 
  scriptData: string, 
  openAIApiKey: string
): Promise<string | null> {
  console.log('📝 Generuję skrypt AIDA na podstawie najlepszego hooka i danych ze Script Data');
  console.log('🔍 Hook:', bestHook);
  console.log('🎯 Cel reklamy:', advertisingGoal || '(brak)');
  
  try {
    // Prompt dla generatora skryptu AIDA
    const aidaScriptPrompt = `Jesteś zawodowym copywriterem specjalizującym się w pisaniu emocjonalnych, pośrednich reklam wideo w strukturze AIDA. Piszesz skrypt oparty o dane z ankiety, wybrany hook i cel reklamy. Twoje reklamy nie sprzedają produktu — tylko sprzedają kolejny krok (np. nagranie, rozmowę, stronę – zgodnie z celem reklamy).

Nie wymyślasz nic od siebie. Używasz wyłącznie danych z ankiety, języka odbiorcy i hooka. Tworzysz reklamę, która zaciekawia, buduje zainteresowanie, wzbudza pragnienie i prowadzi do subtelnego działania.

---

CEL:  
Stwórz 1 reklamę o strukturze AIDA, odpowiadając najpierw na pytania pomocnicze, a potem łącząc odpowiedzi w tekst.

Styl języka: prosty, konkretny, emocjonalny. Mów jak człowiek, nie jak narrator.  
Styl reklamy: pośredni (indirect), bez bezpośredniego pitchu.  
Długość: maksymalnie 1800 znaków (bez hooka).

---

KROK 1 – ZADAJ SOBIE TE PYTANIA I ODPOWIEDZ NA KAŻDE:

1. Czym to się różni od wszystkiego, co widziałem?  
→ Zidentyfikuj, co w tej ofercie jest naprawdę nowe, świeże lub autorskie. Pokaż, że to podejście nie jest kolejną kopią. Użyj języka nowości: autorski, przełomowy, świeże podejście.

2. Co z tego będę mieć?  
→ Skup się na efekcie końcowym. Co zyska odbiorca? Jak może wyglądać jego życie, gdy to zadziała? Opisz to obrazowo – emocjami i faktami.

3. Skąd mam wiedzieć, że to prawda?  
→ Wpleć dowód społeczny. Może to być historia twórcy, liczba klientów, powtarzalność efektów lub konkretne przypadki. Cel: zbudować wiarygodność i bezpieczeństwo.

4. Dlaczego do tej pory mi się nie udało?  
→ Nazwij przyczynę porażek odbiorcy – np. źle dopasowane metody, powierzchowne rozwiązania, zbyt duży chaos, brak wsparcia. Nie obwiniaj odbiorcy. Zdejmij z niego ciężar winy.

5. Kto lub co jest winne?  
→ Pokaż, że zawiódł system, nie człowiek. Wskaż różnice między tą ofertą a podejściem konkurencji (możesz wykorzystać sekcję „konkurencja"). Buduj subtelny kontrast: Us vs. Them.

6. Dlaczego teraz?  
→ Wskaż, co się stanie, jeśli odbiorca nic nie zmieni. Pokaż, że odkładanie problemu pogarsza sytuację. Możesz też dodać: „jeśli nie teraz, to kiedy?".

7. Dlaczego miałbym Ci zaufać?  
→ Użyj danych o twórcy oferty: doświadczenie, droga, misja, pasja, efekty u innych. Krótko – ale wiarygodnie. Pokaż, że za ofertą stoi człowiek, nie system sprzedażowy.

8. Jak to działa?  
→ Wytłumacz bardzo prosto, w 1–2 zdaniach, na czym polega podejście z oferty. Skup się na efekcie: co się dzieje, dlaczego działa, bez szczegółów technicznych.

9. Jak mogę zacząć?  
→ Przekaż jedno jasne CTA, które prowadzi do kolejnego kroku (np. obejrzyj, kliknij, zapisz się). Nie sprzedawaj całego programu – tylko zaproszenie na następny krok.

10. Co mogę stracić? *(opcjonalnie)*  
→ Jeśli zostaje miejsce, pokaż kontrast: co jeśli nic nie zrobisz vs. co jeśli zrobisz. Przykład: „W najgorszym wypadku tylko się dowiesz. W najlepszym — zmienisz wszystko."

---

KROK 2 – POŁĄCZ ODPOWIEDZI W JEDEN SKRYPT REKLAMY

Zbuduj płynny, emocjonalny tekst reklamy o strukturze AIDA:

– Attention → 1–2 zdania rozwijające hook i przytrzymujące uwagę.  
– Interest → pokaż, że rozumiesz, przez co odbiorca przechodzi. Zbuduj kontekst.  
– Desire → pokaż, co może się zmienić. Wpleć dowód, wiarygodność, emocje, Świętą Czwórkę.  
– Action → zakończ prostym CTA, które prowadzi tylko do kolejnego kroku.

Nie pisz nagłówków ani nie oznaczaj sekcji – tekst ma być płynny i naturalny.  
Maksymalna długość: 1800 znaków.

---

ŚWIĘTA CZWÓRKA – DODATKOWE WSKAZÓWKI:

Nowość  
Pokaż, że to świeże podejście. Coś innego niż wszystko, co widział wcześniej.  
Słowa: nowy, autorski, przełomowy, pierwszy raz.

Bezpieczeństwo  
Pokaż, że to działało wcześniej, u innych. Że efekty są przewidywalne.  
Słowa: historia się powtarza, setki przypadków, sprawdzone.

Łatwość  
Nie komplikuj. Pokaż, że to proste do wdrożenia, nawet jeśli ktoś próbował wielu rzeczy wcześniej.  
Słowa: wystarczy, krok po kroku, nie musisz się znać, działa nawet jeśli jesteś zmęczony.

Wielkość  
Pokaż, że to nie tylko mała zmiana – tylko coś, co może naprawdę odmienić codzienność.  
Słowa: zmienisz wszystko, odzyskasz siebie, nowa wersja życia.

---

DANE WEJŚCIOWE:

HOOK:  
${bestHook}

CEL REKLAMY:  
${advertisingGoal || 'Brak określonego celu reklamy'}

DANE Z ANKIETY (skrócone):  
${scriptData}

---

OUTPUT:  
Zwróć tylko jeden gotowy skrypt reklamy w stylu AIDA (bez hooka).  
Nie pisz analiz, nie dziel odpowiedzi – tylko finalny, płynny tekst.  
Maksymalnie 1800 znaków.`;

    console.log('📝 Prompt dla AIDA Script Generator przygotowany');

    // Wywołanie OpenAI API dla AIDA Script Generator
    console.log('📝 Wywołuję OpenAI API dla AIDA Script Generator...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: aidaScriptPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Błąd API OpenAI podczas generowania skryptu AIDA:', {
        status: response.status,
        data: errorData
      });
      return null;
    }

    // Parse response
    const data = await response.json();
    console.log('✅ Generator skryptu AIDA zakończył pracę, model:', data.model);
    
    const scriptContent = data.choices[0].message.content;
    console.log('📝 Wygenerowany skrypt AIDA (fragment):', scriptContent.substring(0, 150) + '...');
    
    return scriptContent;
  } catch (error) {
    console.error('Błąd podczas generowania skryptu AIDA:', error);
    return null;
  }
}
