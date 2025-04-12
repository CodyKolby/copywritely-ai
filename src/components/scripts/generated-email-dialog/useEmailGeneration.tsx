
import { useState, useEffect, useCallback } from 'react';
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
  const [autoSaveAttempted, setAutoSaveAttempted] = useState(false);
  
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
    setAutoSaveAttempted(false);
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
      console.log('EMAIL GENERATION: Starting email generation for target audience:', targetAudienceId);
      console.log('EMAIL GENERATION: Email style:', emailStyle);
      console.log('EMAIL GENERATION: Advertising goal:', advertisingGoal);
      console.log('EMAIL GENERATION: Request timestamp:', requestTimestamp);

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
      
      console.log('EMAIL GENERATION: Narrative blueprint generated:', blueprint);
      
      // Generate subject lines using the narrative blueprint and prompt
      const subjectLinesResponse = await generateSubjectLines(
        blueprint, 
        targetAudienceData, 
        advertisingGoal, 
        emailStyle
      );
      
      console.log('EMAIL GENERATION: Subject lines generated:', subjectLinesResponse);
      
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
      console.log(`EMAIL GENERATION: Selected email structure: ${selectedStructure}`);
      
      // Generate email content based on narrative blueprint and selected structure
      const emailContentResponse = await generateEmailContent(
        blueprint, 
        targetAudienceData, 
        selectedStructure, 
        advertisingGoal, 
        emailStyle
      );
      
      console.log(`EMAIL GENERATION: Email content generated using structure: ${emailContentResponse.structureUsed}`);
      
      // Set the generated email content
      setGeneratedEmail(emailContentResponse.emailContent);
      
      // Update debug info with email content generation details
      setDebugInfo(prev => ({
        ...prev,
        emailContent: emailContentResponse.debugInfo,
        structureUsed: emailContentResponse.structureUsed
      }));

    } catch (err: any) {
      console.error('EMAIL GENERATION: Error generating email:', err);
      setError(err.message || 'Nie udało się wygenerować emaila');
      toast.error('Wystąpił błąd podczas generowania emaila');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSubjectLine = () => {
    console.log('EMAIL GENERATION: Toggling subject lines');
    
    setIsShowingAlternative(!isShowingAlternative);
    
    // Swap the subject lines
    const temp = generatedSubject;
    setGeneratedSubject(alternativeSubject);
    setAlternativeSubject(temp);
    
    console.log('EMAIL GENERATION: Subject lines after toggle:', {
      current: alternativeSubject, 
      alternative: temp
    });
  };

  const handleRetry = () => {
    generateEmail();
  };

  // Modify saveToProject to return a Promise that can be awaited or have .catch() called on it
  const saveToProject = useCallback(async () => {
    console.log('EMAIL GENERATION: Starting saveToProject with data:', {
      userId: !!userId,
      generatedSubject: !!generatedSubject,
      generatedEmail: !!generatedEmail,
      targetAudienceId: !!targetAudienceId,
      hasProjectId: !!projectId
    });
    
    if (!userId || !generatedSubject || !generatedEmail || !targetAudienceId) {
      console.log('EMAIL GENERATION: Missing data for saving email project');
      return Promise.resolve(); // Return resolved promise when no action is taken
    }
    
    // Sprawdźmy czy projekt już został zapisany - unikamy podwójnego zapisu
    if (projectSaved) {
      console.log('EMAIL GENERATION: Project already saved, skipping save operation');
      return Promise.resolve();
    }

    setIsSaving(true);

    try {
      const newProjectId = projectId || uuidv4();
      console.log('EMAIL GENERATION: Saving email to project with ID:', newProjectId);
      
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
      
      console.log('EMAIL GENERATION: Email successfully saved to projects with ID:', newProjectId);
      return Promise.resolve(); // Return resolved promise for successful save

    } catch (err: any) {
      console.error('EMAIL GENERATION: Error saving email to projects:', err);
      // Toast is handled in the saveEmailToProject function
      return Promise.reject(err); // Return rejected promise so error can be caught
    } finally {
      setIsSaving(false);
    }
  }, [userId, generatedSubject, generatedEmail, targetAudienceId, projectId, narrativeBlueprint, alternativeSubject, projectSaved]);

  const handleViewProject = useCallback(() => {
    if (projectId) {
      navigate(`/copy-editor/${projectId}`);
    } else {
      toast.error('Nie można otworzyć projektu - brak ID projektu');
    }
  }, [projectId, navigate]);

  // Auto-save Effect - zostaje, ale zapobiega podwójnemu zapisowi
  useEffect(() => {
    const performAutoSave = async () => {
      if (
        !isLoading && 
        !error && 
        generatedSubject && 
        generatedEmail && 
        userId && 
        targetAudienceId && 
        !projectSaved && 
        !autoSaveAttempted && 
        !isSaving &&
        open
      ) {
        console.log('EMAIL GENERATION: Auto-save triggered');
        setAutoSaveAttempted(true);
        try {
          await saveToProject();
        } catch (err) {
          console.error('EMAIL GENERATION: Auto-save failed:', err);
          // Error notification handled in saveToProject
        }
      }
    };
    
    if (open) {
      console.log('EMAIL GENERATION: Checking conditions for auto-save:', {
        isLoading,
        hasError: !!error,
        hasSubject: !!generatedSubject,
        hasEmail: !!generatedEmail,
        hasUserId: !!userId,
        hasTargetAudience: !!targetAudienceId,
        projectSaved,
        autoSaveAttempted,
        isSaving
      });
      performAutoSave();
    }
  }, [
    isLoading, 
    error, 
    generatedSubject, 
    generatedEmail, 
    userId, 
    targetAudienceId, 
    projectSaved, 
    autoSaveAttempted, 
    isSaving, 
    open, 
    saveToProject
  ]);

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
