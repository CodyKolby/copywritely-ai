
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

// Typy pól, które mogą być kompresowane
export type CompressibleField = 
  | 'offerDetails' 
  | 'language' 
  | 'beliefs' 
  | 'biography' 
  | 'competitors' 
  | 'whyItWorks' 
  | 'experience';

// Mapowanie pól na odpowiednie prompty do kompresji
const compressionPrompts: Record<CompressibleField, string> = {
  offerDetails: "Zredukuj opis oferty do maksymalnie 2–3 zdań. Zachowaj tylko unikalne elementy, usuń wszelkie powtórzenia i ogólniki. Nie opisuj tego samego więcej niż raz.",
  language: "Zredukuj listę do maksymalnie 10 najczęściej powtarzających się lub emocjonalnie silnych słów-kluczy, które najlepiej oddają problemy, nastroje i sposób mówienia klienta. Usuń synonimy, dublujące się wyrażenia i niepotrzebne odmiany.",
  beliefs: "Zredukuj odpowiedź do 2–3 głównych idei, w które klientka ma uwierzyć dzięki tej usłudze. Skup się na emocjach, przemianie, poczuciu sprawczości i korzyściach długofalowych. Usuń wszystkie ozdobniki i powtórzenia.",
  biography: "Streszcz biografię klientki w maksymalnie 2–3 zdaniach. Uwzględnij jej stan emocjonalny, historię prób i błędów oraz aktualny punkt startowy. Nie opisuj zbędnych szczegółów medycznych, jeśli się powtarzają. Pokaż najważniejsze wzorce.",
  competitors: "Dla każdego konkurenta wygeneruj jedno zdanie, które opisuje jego główną cechę oraz czym różni się od Twojej oferty. Jeśli kilku konkurentów ma ten sam problem, wspomnij o tym raz i połącz ich opis.",
  whyItWorks: "Zredukuj odpowiedź do maksymalnie 2 zdań, które oddają, dlaczego produkt jest skuteczny. Uwzględnij osobiste doświadczenie, kontakt z klientkami, podejście eksperckie lub emocjonalne. Pomiń wszystko, co się powtarza.",
  experience: "Skróć odpowiedź do 2–3 zdań, które pokazują doświadczenie i efekty klientów. Uwzględnij tylko najbardziej konkretne dane, nie opisuj pełnych historii, tylko ich sedno. Unikaj zbyt ogólnych fraz."
};

// Funkcja do kompresji pojedynczego pola
export const compressField = async (field: CompressibleField, content: string): Promise<string> => {
  try {
    console.log(`Kompresja pola ${field} rozpoczęta`);
    
    // Dla tablicowych wartości, przekształć na tekst
    let textContent = content;
    if (Array.isArray(content)) {
      textContent = content.filter(item => item.trim().length > 0).join("\n");
    }
    
    // Jeśli treść jest pusta, zwróć ją bez kompresji
    if (!textContent || textContent.trim().length === 0) {
      return content;
    }
    
    // Pobierz odpowiedni prompt dla pola
    const prompt = compressionPrompts[field];
    
    // Wywołaj API OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Jesteś agentem kompresującym dane. Zwracaj tylko skompresowany tekst, bez dodatkowych komentarzy czy objaśnień. Nigdy nie używaj zwrotów takich jak "Skompresowana treść:", "Oto skrócona wersja:" itp. Zwróć po prostu skompresowany tekst.'
          },
          { 
            role: 'user', 
            content: `${prompt}\n\nTreść do skompresowania:\n${textContent}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const compressedContent = data.choices[0].message.content;
    
    console.log(`Kompresja pola ${field} zakończona pomyślnie`);
    
    // Dla pól tablicowych, przekształć spowrotem na tablicę
    if (Array.isArray(content)) {
      // Zakładamy, że kompresowany tekst będzie zawierał elementy oddzielone nową linią lub przecinkami
      return compressedContent
        .split(/[\n,]+/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
    }
    
    return compressedContent;
  } catch (error) {
    console.error(`Błąd kompresji pola ${field}:`, error);
    // W razie błędu zwracamy oryginalną treść
    return content;
  }
};

// Funkcja do kompresji wszystkich istotnych pól
export const compressFormData = async (formData: any): Promise<any> => {
  try {
    console.log('Rozpoczynam kompresję danych formularza');
    const compressedData = { ...formData };
    
    // Lista pól do kompresji
    const fieldsToCompress: CompressibleField[] = [
      'offerDetails',
      'language',
      'beliefs',
      'biography',
      'competitors',
      'whyItWorks',
      'experience'
    ];
    
    // Kompresuj każde pole
    for (const field of fieldsToCompress) {
      if (compressedData[field] !== undefined && compressedData[field] !== null) {
        compressedData[field] = await compressField(field, compressedData[field]);
      }
    }
    
    console.log('Kompresja danych formularza zakończona');
    return compressedData;
  } catch (error) {
    console.error('Błąd podczas kompresji danych formularza:', error);
    toast.error('Wystąpił błąd podczas przetwarzania danych');
    // W razie błędu zwracamy oryginalne dane
    return formData;
  }
};
