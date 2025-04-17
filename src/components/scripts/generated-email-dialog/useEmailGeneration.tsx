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
  userId,
  existingProject
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
  const [generationFlowId, setGenerationFlowId] = useState<string>('');
  
  const navigate = useNavigate();

  useEffect(() => {
    if (existingProject && open) {
      console.log('EMAIL GENERATION: Loading existing project:', existingProject.id);
      setGeneratedSubject(existingProject.subject || existingProject.title || '');
      setGeneratedEmail(existingProject.content || '');
      
      // Check if we have an alternativeSubject in the project metadata
      if (existingProject.alternativeSubject) {
        setAlternativeSubject(existingProject.alternativeSubject);
        console.log('EMAIL GENERATION: Loading alternative subject from project metadata:', existingProject.alternativeSubject);
      } else {
        // Generate a different alternative subject instead of just adding "Alternative:"
        const generatedAltSubject = `Alternatywny wariant: ${existingProject.subject || existingProject.title || ''}`;
        setAlternativeSubject(generatedAltSubject);
        console.log('EMAIL GENERATION: Created alternative subject:', generatedAltSubject);
      }
      
      setProjectId(existingProject.id);
      setProjectSaved(true);
      setIsLoading(false);
      setAutoSaveAttempted(true);
    } else if (open && !existingProject) {
      resetState();
    }
  }, [existingProject, open]);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  useEffect(() => {
    if (open && targetAudienceId && !existingProject && !generatedEmail) {
      generateEmail();
    }
  }, [open, targetAudienceId, existingProject]);

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
    setGenerationFlowId('');
  };

  const generateEmail = async () => {
    if (!targetAudienceId) {
      setError('Brak ID grupy docelowej');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // Create a unique flow ID for this generation process
    const flowId = uuidv4();
    setGenerationFlowId(flowId);
    
    const startTimestamp = new Date().toISOString();
    setRequestTimestamp(startTimestamp);

    console.log(`🔵 EMAIL GENERATION [${flowId}]: Starting email generation at ${startTimestamp}`);
    console.log(`🔵 EMAIL GENERATION [${flowId}]: Target audience ID:`, targetAudienceId);
    console.log(`🔵 EMAIL GENERATION [${flowId}]: Email style:`, emailStyle);
    console.log(`🔵 EMAIL GENERATION [${flowId}]: Advertising goal:`, advertisingGoal);

    try {
      // Step 1: Get target audience data
      console.log(`🔵 EMAIL GENERATION [${flowId}]: Fetching target audience data...`);
      
      const { data: targetAudienceData, error: targetAudienceError } = await supabase
        .from('target_audiences')
        .select('*')
        .eq('id', targetAudienceId)
        .single();

      if (targetAudienceError) {
        throw new Error(`Nie udało się pobrać danych grupy docelowej: ${targetAudienceError.message}`);
      }
      
      console.log(`🔵 EMAIL GENERATION [${flowId}]: Target audience data retrieved:`, 
        targetAudienceData ? { id: targetAudienceData.id, name: targetAudienceData.name } : null);

      // Step 2: Generate narrative blueprint
      console.log(`🔵 EMAIL GENERATION [${flowId}]: Generating narrative blueprint...`);
      let blueprint: NarrativeBlueprint;
      
      try {
        blueprint = await generateNarrativeBlueprint(targetAudienceData, emailStyle, advertisingGoal);
        console.log(`🔵 EMAIL GENERATION [${flowId}]: Narrative blueprint generated successfully`);
        setNarrativeBlueprint(blueprint);
      } catch (blueprintError: any) {
        console.error(`🔴 EMAIL GENERATION [${flowId}]: Blueprint generation failed:`, blueprintError);
        throw new Error(`Nie udało się wygenerować blueprint narracyjnego: ${blueprintError.message}`);
      }
      
      // Step 3: Generate subject lines
      console.log(`🔵 EMAIL GENERATION [${flowId}]: Generating subject lines...`);
      let subjectLinesResponse;
      let subject1 = "Domyślny tytuł emaila";
      let subject2 = "Alternatywny tytuł emaila";
      
      try {
        subjectLinesResponse = await generateSubjectLines(
          blueprint, 
          targetAudienceData, 
          advertisingGoal, 
          emailStyle
        );
        
        console.log(`🔵 EMAIL GENERATION [${flowId}]: Subject lines generated:`, {
          subject1: subjectLinesResponse.subject1,
          subject2: subjectLinesResponse.subject2
        });
        
        setDebugInfo({
          subjectLines: subjectLinesResponse.debugInfo,
          emailStructure: emailStructure
        });
        
        // Set two distinctly different subject lines
        subject1 = subjectLinesResponse.subject1;
        subject2 = subjectLinesResponse.subject2;
        setGeneratedSubject(subject1);
        setAlternativeSubject(subject2);
      } catch (subjectError: any) {
        console.error(`🔴 EMAIL GENERATION [${flowId}]: Subject line generation failed:`, subjectError);
        // Don't throw here, continue with default subjects
      }
      
      // Step 4: Select email structure and generate content
      const selectedStructure = selectRandomEmailStructure();
      setEmailStructure(selectedStructure);
      console.log(`🔵 EMAIL GENERATION [${flowId}]: Selected email structure: ${selectedStructure}`);
      
      try {
        const emailContentResponse = await generateEmailContent(
          blueprint, 
          targetAudienceData, 
          selectedStructure, 
          advertisingGoal, 
          emailStyle,
          subject1,  // Pass the first subject
          subject2   // Pass the second subject
        );
        
        console.log(`🔵 EMAIL GENERATION [${flowId}]: Email content generated using structure: ${emailContentResponse.structureUsed}`);
        
        setGeneratedEmail(emailContentResponse.emailContent);
        
        setDebugInfo(prev => ({
          ...prev,
          emailContent: emailContentResponse.debugInfo,
          structureUsed: emailContentResponse.structureUsed
        }));
      } catch (contentError: any) {
        console.error(`🔴 EMAIL GENERATION [${flowId}]: Email content generation failed:`, contentError);
        throw new Error(`Nie udało się wygenerować treści emaila: ${contentError.message}`);
      }
      
      console.log(`🔵 EMAIL GENERATION [${flowId}]: Email generation completed successfully`);

    } catch (err: any) {
      console.error(`🔴 EMAIL GENERATION [${flowId}]: Error generating email:`, err);
      setError(err.message || 'Nie udało się wygenerować emaila');
      toast.error('Wystąpił błąd podczas generowania emaila');
    } finally {
      setIsLoading(false);
      console.log(`🔵 EMAIL GENERATION [${flowId}]: Generation process finished`);
    }
  };

  const toggleSubjectLine = () => {
    console.log('EMAIL GENERATION: Toggling subject lines');
    
    setIsShowingAlternative(!isShowingAlternative);
    
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

  const saveToProject = useCallback(async () => {
    console.log('EMAIL GENERATION: Starting saveToProject with data:', {
      userId: !!userId,
      generatedSubject: !!generatedSubject,
      alternativeSubject: !!alternativeSubject,
      generatedEmail: !!generatedEmail,
      targetAudienceId: !!targetAudienceId,
      hasProjectId: !!projectId,
      existingProject: !!existingProject
    });
    
    if (existingProject) {
      console.log('EMAIL GENERATION: Using existing project, skipping save');
      return Promise.resolve();
    }
    
    if (!userId || !generatedSubject || !generatedEmail) {
      console.log('EMAIL GENERATION: Missing data for saving email project');
      return Promise.resolve();
    }
    
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
        targetAudienceId || '',
        narrativeBlueprint || undefined,
        alternativeSubject // Pass the alternative subject explicitly
      );
      
      setProjectId(newProjectId);
      setProjectSaved(true);
      
      console.log('EMAIL GENERATION: Email successfully saved to projects with ID:', newProjectId);
      return Promise.resolve();

    } catch (err: any) {
      console.error('EMAIL GENERATION: Error saving email to projects:', err);
      return Promise.reject(err);
    } finally {
      setIsSaving(false);
    }
  }, [userId, generatedSubject, generatedEmail, targetAudienceId, projectId, narrativeBlueprint, alternativeSubject, projectSaved, existingProject]);

  const handleViewProject = useCallback(() => {
    if (projectId) {
      navigate(`/copy-editor/${projectId}`);
    } else {
      toast.error('Nie można otworzyć projektu - brak ID projektu');
    }
  }, [projectId, navigate]);

  useEffect(() => {
    const performAutoSave = async () => {
      if (existingProject) {
        return;
      }
      
      if (
        !isLoading && 
        !error && 
        generatedSubject && 
        generatedEmail && 
        userId && 
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
        }
      }
    };
    
    if (open && !existingProject) {
      console.log('EMAIL GENERATION: Checking conditions for auto-save:', {
        isLoading,
        hasError: !!error,
        hasSubject: !!generatedSubject,
        hasEmail: !!generatedEmail,
        hasUserId: !!userId,
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
    projectSaved, 
    autoSaveAttempted, 
    isSaving, 
    open, 
    saveToProject,
    existingProject
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
    emailStructure,
    setAlternativeSubject
  };
};
