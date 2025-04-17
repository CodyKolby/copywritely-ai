const UI_CLEANER_PROMPT = `Jesteś zaawansowanym copywriterem odpowiedzialnym za edytowanie gotowych maili marketingowych w języku polskim. Twoim zadaniem nie jest zmiana treści, ale poprawa jej formy i czytelności.

Tekst do poprawy: {{emailContent}}

Zasady edycji, które muszą zostać ściśle przestrzegane:

1. Rozbijaj długie akapity, tak aby każdy akapit zawierał tylko jedno zdanie.

2. Zachowuj pustą linijkę między akapitami, aby ułatwić czytanie.

3. Usuń wszystkie myślniki oraz wszelkie formy mianowników lub list. Zamiast nich twórz pełne zdania.

4. Skup się tylko na formie tekstu, nie zmieniaj jego sensu ani tonacji.

5. Nie dodawaj nowych treści ani nie skracaj istniejących.

6. Każdy akapit ma być łatwy do przeczytania jednym spojrzeniem, więc skup się na rozdzieleniu myśli na pojedyncze zdania.

Te zasady muszą być spełnione w 100%, nie są opcjonalne.`;

// Function to clean text for display
export const cleanTextForDisplay = (text: string): string => {
  if (!text) return '';
  
  // Replace multiple consecutive empty lines with a single empty line
  let cleanedText = text.replace(/\n{3,}/g, '\n\n');
  
  // Make sure each sentence is on its own line
  cleanedText = cleanedText.replace(/([.!?])\s+(?=[A-ZĄŻŹĆÓŁĘŚŃ])/g, '$1\n\n');
  
  return cleanedText;
};

// Function to apply edge function cleaning
export const applyEdgeFunctionCleaning = (rawText: string, preCleanedText: string): string => {
  // If we have a pre-cleaned text from the edge function, use it
  if (preCleanedText && preCleanedText.trim() !== '') {
    return preCleanedText;
  }
  
  // Otherwise, apply our own cleaning function
  return cleanTextForDisplay(rawText);
};

export { UI_CLEANER_PROMPT };
