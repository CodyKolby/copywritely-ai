
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

interface NarrativeBlueprint {
  punktyemocjonalne: string;
  stylmaila: string;
  osnarracyjna: string;
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
  const [narrativeBlueprint, setNarrativeBlueprint] = useState<NarrativeBlueprint | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (open && targetAudienceId && !generatedEmail) {
      generateEmail();
    }
  }, [open, targetAudienceId]);

  const generateNarrativeBlueprint = async (targetAudienceData: any): Promise<NarrativeBlueprint> => {
    console.log('Generating narrative blueprint...');
    try {
      const { data, error } = await supabase.functions.invoke('narrative-blueprint', {
        body: {
          surveyData: targetAudienceData,
          emailStyle,
          advertisingGoal
        }
      });
      
      if (error) throw new Error(`Error invoking narrative-blueprint: ${error.message}`);
      
      console.log('Narrative blueprint generated successfully:', data);
      return data as NarrativeBlueprint;
    } catch (err: any) {
      console.error('Failed to generate narrative blueprint:', err);
      throw new Error('Nie udało się wygenerować blueprint narracyjnego');
    }
  };

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

      // First, fetch the target audience data
      const { data: targetAudienceData, error: targetAudienceError } = await supabase
        .from('target_audiences')
        .select('*')
        .eq('id', targetAudienceId)
        .single();

      if (targetAudienceError) {
        throw new Error(`Nie udało się pobrać danych grupy docelowej: ${targetAudienceError.message}`);
      }

      // Generate narrative blueprint using the target audience data
      const blueprint = await generateNarrativeBlueprint(targetAudienceData);
      setNarrativeBlueprint(blueprint);
      
      console.log('Blueprint narracyjny wygenerowany:', blueprint);
      
      // For now, we'll use mock data for the email content
      // In the future, this would be replaced with another Edge Function call
      // that would use the narrative blueprint to generate the actual email
      setGeneratedSubject('Rewolucyjne rozwiązanie do [Problem] - Poznaj naszą ofertę');
      setGeneratedEmail(`Drogi [Imię],

Czy zmagasz się z [problem]? ${blueprint.punktyemocjonalne.split('\n')[0]}

${blueprint.punktyemocjonalne.split('\n')[1] || 'Wiele osób takich jak Ty każdego dnia traci czas i pieniądze przez nieefektywne rozwiązania.'}

Nasz produkt [Nazwa] został zaprojektowany specjalnie, aby rozwiązać ten problem raz na zawsze. ${blueprint.osnarracyjna}

Oto co oferujemy:
- [Korzyść 1]
- [Korzyść 2]
- [Korzyść 3]

${blueprint.stylmaila.split('\n')[0] || 'Nie czekaj dłużej! Kliknij poniższy link, aby dowiedzieć się więcej i skorzystać z naszej specjalnej oferty:'}
[Przycisk CTA]

Z pozdrowieniami,
[Twoje imię]`);

      // TODO: Replace with actual Edge Function call to generate email content
      // const { data, error } = await supabase.functions.invoke('generate-email', {
      //   body: {
      //     targetAudienceId,
      //     templateId,
      //     advertisingGoal,
      //     emailStyle,
      //     narrativeBlueprint: blueprint
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
      
      const projectData = {
        id: newProjectId,
        title: `Email: ${generatedSubject.substring(0, 50)}`,
        content: generatedEmail,
        subject: generatedSubject,
        user_id: userId,
        type: 'email',
        status: 'Draft' as 'Draft' | 'Completed' | 'Reviewed', // Fix: Explicitly set as enum type
        target_audience_id: targetAudienceId
      };
      
      // If we have a narrative blueprint, include it in the metadata
      if (narrativeBlueprint) {
        Object.assign(projectData, {
          metadata: {
            narrativeBlueprint: {
              punktyEmocjonalne: narrativeBlueprint.punktyemocjonalne,
              stylMaila: narrativeBlueprint.stylmaila,
              osNarracyjna: narrativeBlueprint.osnarracyjna
            }
          }
        });
      }
      
      // Save to database
      const { error } = await supabase
        .from('projects')
        .insert(projectData);
      
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
    narrativeBlueprint,
    handleRetry,
    saveToProject,
    handleViewProject,
    setGeneratedSubject,
    setGeneratedEmail
  };
};
