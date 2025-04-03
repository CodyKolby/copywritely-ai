
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { EmailStyle } from '../EmailStyleDialog';

interface UseEmailGenerationProps {
  open: boolean;
  targetAudienceId: string;
  templateId: string;
  advertisingGoal: string;
  emailStyle: EmailStyle;
  userId?: string;
}

export const useEmailGeneration = ({
  open,
  targetAudienceId,
  templateId,
  advertisingGoal,
  emailStyle,
  userId
}: UseEmailGenerationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedSubject, setGeneratedSubject] = useState<string>('');
  const [generatedEmail, setGeneratedEmail] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [projectSaved, setProjectSaved] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (open && targetAudienceId && !generatedEmail) {
      generateEmail();
    }
  }, [open, targetAudienceId]);

  const generateEmail = async () => {
    if (!targetAudienceId) {
      setError('Brak ID grupy docelowej');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Rozpoczynam generowanie emaila dla grupy docelowej:', targetAudienceId);
      console.log('Styl emaila:', emailStyle);
      console.log('Cel reklamy:', advertisingGoal);

      // Mock data for now - this will be replaced with actual Edge Function call
      setTimeout(() => {
        // Example mock data
        setGeneratedSubject('Rewolucyjne rozwiązanie do [Problem] - Poznaj naszą ofertę');
        setGeneratedEmail(`Drogi [Imię],

Czy zmagasz się z [problem]? Wiele osób takich jak Ty każdego dnia traci czas i pieniądze przez nieefektywne rozwiązania.

Nasz produkt [Nazwa] został zaprojektowany specjalnie, aby rozwiązać ten problem raz na zawsze. Dzięki unikalnej technologii [cecha], możesz osiągnąć [korzyść] szybciej niż kiedykolwiek wcześniej.

Oto co oferujemy:
- [Korzyść 1]
- [Korzyść 2]
- [Korzyść 3]

Nie czekaj dłużej! Kliknij poniższy link, aby dowiedzieć się więcej i skorzystać z naszej specjalnej oferty:
[Przycisk CTA]

Z pozdrowieniami,
[Twoje imię]`);
        setIsLoading(false);
      }, 3000);

      // TODO: Replace with actual Edge Function call
      // const { data, error } = await supabase.functions.invoke('generate-email', {
      //   body: {
      //     targetAudienceId,
      //     templateId,
      //     advertisingGoal,
      //     emailStyle
      //   }
      // });
      // 
      // if (error) throw error;
      // 
      // if (data.subject && data.emailContent) {
      //   setGeneratedSubject(data.subject);
      //   setGeneratedEmail(data.emailContent);
      // } else {
      //   throw new Error('Nie udało się wygenerować emaila');
      // }

    } catch (err: any) {
      console.error('Error generating email:', err);
      setError(err.message || 'Nie udało się wygenerować emaila');
      toast.error('Wystąpił błąd podczas generowania emaila');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    generateEmail();
  };

  const saveToProject = async () => {
    if (!userId || !generatedSubject || !generatedEmail) return;

    setIsSaving(true);

    try {
      const newProjectId = uuidv4();
      
      // For regular users - save to database
      const { error } = await supabase
        .from('projects')
        .insert({
          id: newProjectId,
          title: `Email: ${generatedSubject.substring(0, 50)}`,
          content: generatedEmail,
          subject: generatedSubject,
          user_id: userId,
          type: 'email',
          status: 'Draft',
          target_audience_id: targetAudienceId
        });
      
      if (error) throw error;
      
      setProjectId(newProjectId);
      setProjectSaved(true);
      toast.success('Email zapisany w projektach');

    } catch (err: any) {
      console.error('Error saving email to projects:', err);
      toast.error('Nie udało się zapisać emaila');
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewProject = () => {
    if (projectId) {
      navigate(`/copy-editor/${projectId}`);
    }
  };

  return {
    isLoading,
    generatedSubject,
    generatedEmail,
    error,
    isSaving,
    projectSaved,
    projectId,
    handleRetry,
    saveToProject,
    handleViewProject,
    setGeneratedSubject,
    setGeneratedEmail
  };
};
