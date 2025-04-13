
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Using environment variable from Vite instead of Deno
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

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
    
    // Próba wywołania edge function z obsługą błędów CORS
    try {
      // W przypadku błędu CORS lub innych problemów z edge function, zwracamy oryginalny tekst
      // bez przerywania procesu zapisywania
      const { data, error } = await supabase.functions.invoke('compress-text', {
        body: {
          text: textContent,
          prompt: prompt,
          field: field
        }
      });
      
      if (error) {
        console.warn(`Ostrzeżenie kompresji: ${error.message}`);
        return content; // W razie błędu zwracamy oryginalną treść
      }
      
      const compressedContent = data.compressedText;
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
      console.warn(`Błąd funkcji kompresji: ${error}. Używam oryginalnej zawartości.`);
      return content; // W razie błędu zwracamy oryginalną treść
    }
  } catch (error) {
    console.warn(`Błąd kompresji pola ${field}:`, error);
    // W razie błędu zwracamy oryginalną treść
    return content;
  }
};

// Funkcja do kompresji wszystkich istotnych pól
export const compressFormData = async (formData: any): Promise<any> => {
  try {
    console.log('Rozpoczynam kompresję danych formularza');
    const compressedData = { ...formData };
    
    // If advertisingGoal exists, remove it before compression
    if ('advertisingGoal' in compressedData) {
      // Save it to restore after compression
      const advertisingGoal = compressedData.advertisingGoal;
      delete compressedData.advertisingGoal;
      
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
      
      // Kompresuj każde pole, ale nie przerywaj procesu w razie błędów
      for (const field of fieldsToCompress) {
        if (compressedData[field] !== undefined && compressedData[field] !== null) {
          try {
            compressedData[field] = await compressField(field, compressedData[field]);
          } catch (fieldError) {
            console.warn(`Błąd kompresji pola ${field}:`, fieldError);
            // Zachowujemy oryginalne dane, nie przerywając procesu
          }
        }
      }
      
      // For UI purposes only, we can restore the advertisingGoal field
      // It won't be sent to the database anyway
      if (advertisingGoal) {
        compressedData.advertisingGoal = advertisingGoal;
      }
      
      console.log('Kompresja danych formularza zakończona');
      return compressedData;
    } else {
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
      
      // Kompresuj każde pole, ale nie przerywaj procesu w razie błędów
      for (const field of fieldsToCompress) {
        if (compressedData[field] !== undefined && compressedData[field] !== null) {
          try {
            compressedData[field] = await compressField(field, compressedData[field]);
          } catch (fieldError) {
            console.warn(`Błąd kompresji pola ${field}:`, fieldError);
            // Zachowujemy oryginalne dane, nie przerywając procesu
          }
        }
      }
      
      console.log('Kompresja danych formularza zakończona');
      return compressedData;
    }
  } catch (error) {
    console.error('Błąd podczas kompresji danych formularza:', error);
    toast.error('Wystąpił błąd podczas przetwarzania danych, ale dane zostaną zapisane');
    // W razie błędu zwracamy oryginalne dane
    return formData;
  }
};
