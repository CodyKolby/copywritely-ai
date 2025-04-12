
import { NarrativeBlueprint } from './narrative-blueprint-service';
import { EmailStyle } from '../../EmailStyleDialog';
import { cleanTextForDisplay } from './ui-cleaner-service';

export interface SubjectLinesResponse {
  subject1: string;
  subject2: string;
  debugInfo: any;
}

export const DEFAULT_SUBJECT_LINE_PROMPT = `
Stwórz dwie unikalne i różniące się treścią linie tytułowe dla emaila. 
Pierwsza powinna być bardziej bezpośrednia i zorientowana na wartość.
Druga powinna budzić ciekawość i wprowadzać element zaskoczenia.
Obie powinny być przekonujące i dopasowane do grupy docelowej.

Ważne: Tytuły muszą się od siebie znacząco różnić pod względem treści, podejścia i stylu.
Nie powtarzaj tych samych słów kluczowych w obu tytułach.
`;

// Mock implementation for now - will be replaced with real API call in the future
export const generateSubjectLines = async (
  narrativeBlueprint: NarrativeBlueprint,
  targetAudience: any,
  advertisingGoal: string,
  emailStyle: EmailStyle
): Promise<SubjectLinesResponse> => {
  console.log('Generating subject lines with parameters:', {
    narrativeBlueprint,
    targetAudienceId: targetAudience.id,
    advertisingGoal,
    emailStyle
  });

  // Generate two distinctly different subject lines based on the style
  const defaultSubjects = getDefaultSubjectsByStyle(emailStyle);
  
  return {
    subject1: cleanTextForDisplay(defaultSubjects.subject1),
    subject2: cleanTextForDisplay(defaultSubjects.subject2),
    debugInfo: {
      narrativeBlueprint,
      targetAudience,
      advertisingGoal,
      emailStyle
    }
  };
};

// Helper function to get default subject lines based on email style
function getDefaultSubjectsByStyle(emailStyle: EmailStyle): { subject1: string, subject2: string } {
  switch (emailStyle) {
    case 'direct-sales':
      return {
        subject1: 'Specjalna oferta tylko dla Ciebie - oszczędź do 50%',
        subject2: 'Czy wiesz, co tracisz nie korzystając z naszej usługi?'
      };
    case 'educational':
      return {
        subject1: '5 sposobów na rozwiązanie Twojego problemu [poradnik]',
        subject2: 'Ta wiedza zmieni Twoje podejście do biznesu'
      };
    case 'story':
      return {
        subject1: 'Historia Marka: od porażki do sukcesu w 3 miesiące',
        subject2: 'Co odkryłem po latach zmagań z tym samym problemem?'
      };
    case 'relationship':
      return {
        subject1: 'Dziękujemy za bycie częścią naszej społeczności [specjalny prezent]',
        subject2: 'Mamy coś wyjątkowego tylko dla długoletnich klientów'
      };
    default:
      return {
        subject1: 'Odkryj rozwiązanie, które zmieni Twój biznes',
        subject2: 'Czy wiesz, że 80% firm popełnia ten błąd?'
      };
  }
}
