import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  generateNarrativeBlueprint, 
  type NarrativeBlueprint
} from './services/narrative-blueprint-service';
import {
  generateSubjectLines
} from './services/subject-line-service';
import {
  generateEmailContent,
  selectRandomEmailStructure,
  type EmailStructure
} from './services/email-content-service';
import { 
  saveEmailToProject
} from './services/email-project-service';
import { 
  UseEmailGenerationProps, 
  EmailGenerationHookReturn 
} from './email-generation-types';

export const useEmailGeneration = ({
  open,
  targetAudienceId,
  templateId,
  advertisingGoal,
  emailStyle,
  userId
}: UseEmailGenerationProps): EmailGenerationHookReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedSubject, setGeneratedSubject] = useState<string>('');
  const [alternativeSubject, setAlternativeSubject] = useState<string>('');
  const [generatedEmail, setGeneratedEmail] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [projectSaved, setProjectSaved] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [narrativeBlueprint, setNarrativeBlueprint] = useState<NarrativeBlueprint | null>(null);
  const [isShowingAlternative, setIsShowingAlternative] = useState(false);
  const [requestTimestamp, setRequestTimestamp] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [emailStructure, setEmailStructure] = useState<EmailStructure>('PAS');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  useEffect(() => {
    if (open && targetAudienceId && !generatedEmail) {
      generateEmail();
    }
  }, [open, targetAudienceId]);

  const resetState = () => {
    setError(null);
    setGeneratedSubject('');
    setAlternativeSubject('');
    setGeneratedEmail('');
    setProjectSaved(false);
    setProjectId(null);
    setNarrativeBlueprint(null);
    setIsShowingAlternative(false);
    setRequestTimestamp(null);
    setDebugInfo(null);
    setEmailStructure('PAS');
  };

  const generateEmail = async () => {
    if (!targetAudienceId) {
      setError('Brak ID grupy docelowej');
      return;
    }

    setIsLoading(true);
    setError(null);
    setRequestTimestamp(new Date().toISOString());

    try {
      console.log('Rozpoczynam generowanie emaila dla grupy docelowej:', targetAudienceId);
      console.log('Styl emaila:', emailStyle);
      console.log('Cel reklamy:', advertisingGoal);
      console.log('Timestamp żądania:', requestTimestamp);

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
      const blueprint = await generateNarrativeBlueprint(targetAudienceData, emailStyle, advertisingGoal);
      setNarrativeBlueprint(blueprint);
      
      console.log('Blueprint narracyjny wygenerowany:', blueprint);
      
      // Generate subject lines using the narrative blueprint and prompt
      const subjectLinesResponse = await generateSubjectLines(
        blueprint, 
        targetAudienceData, 
        advertisingGoal, 
        emailStyle
      );
      
      console.log('Otrzymane tytuły maila w useEmailGeneration:', subjectLinesResponse);
      console.log('Subject line response timestamp:', subjectLinesResponse.timestamp || 'not provided');
      console.log('Raw output from OpenAI:', subjectLinesResponse.rawOutput || 'not provided');
      
      // Store debug info
      setDebugInfo({
        subjectLines: subjectLinesResponse.debugInfo,
        emailStructure: emailStructure
      });
      
      // Set the subject lines exactly as received from the API
      setGeneratedSubject(subjectLinesResponse.subject1);
      setAlternativeSubject(subjectLinesResponse.subject2);
      
      // Randomly select email structure (PAS or CJN)
      const selectedStructure = selectRandomEmailStructure();
      setEmailStructure(selectedStructure);
      console.log(`Wylosowana struktura emaila: ${selectedStructure}`);
      
      // Generate email content based on narrative blueprint and selected structure
      const emailContentResponse = await generateEmailContent(
        blueprint, 
        targetAudienceData, 
        selectedStructure, 
        advertisingGoal, 
        emailStyle
      );
      
      console.log(`Email wygenerowany z użyciem struktury: ${emailContentResponse.structureUsed}`);
      
      // Set the generated email content
      setGeneratedEmail(emailContentResponse.emailContent);
      
      // Update debug info with email content generation details
      setDebugInfo(prev => ({
        ...prev,
        emailContent: emailContentResponse.debugInfo,
        structureUsed: emailContentResponse.structureUsed
      }));

    } catch (err: any) {
      console.error('Error generating email:', err);
      setError(err.message || 'Nie udało się wygenerować emaila');
      toast.error('Wystąpił błąd podczas generowania emaila');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubjectLine = () => {
    console.log('Toggling subject lines:', {
      before: {
        current: generatedSubject,
        alternative: alternativeSubject,
        isShowingAlternative
      }
    });
    
    setIsShowingAlternative(!isShowingAlternative);
    
    // Swap the subject lines
    const temp = generatedSubject;
    setGeneratedSubject(alternativeSubject);
    setAlternativeSubject(temp);
    
    console.log('Subject lines after toggle:', {
      after: {
        current: alternativeSubject, // This will be the new current
        alternative: temp, // This will be the new alternative
        isShowingAlternative: !isShowingAlternative
      }
    });
  };

  const handleRetry = () => {
    generateEmail();
  };

  const saveToProject = async () => {
    if (!userId || !generatedSubject || !generatedEmail || !targetAudienceId) return;

    setIsSaving(true);

    try {
      const newProjectId = uuidv4();
      
      await saveEmailToProject(
        newProjectId,
        generatedSubject,
        generatedEmail,
        userId,
        targetAudienceId,
        narrativeBlueprint || undefined,
        alternativeSubject
      );
      
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
    alternativeSubject,
    isShowingAlternative,
    toggleSubjectLine,
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
    setGeneratedEmail,
    debugInfo,
    emailStructure
  };
};
