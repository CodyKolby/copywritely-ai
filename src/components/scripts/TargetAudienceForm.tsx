
import React, { useState, KeyboardEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth/AuthContext';

// Import refactored components
import StepContainer from './target-audience-form/StepContainer';
import NavigationControls from './target-audience-form/NavigationControls';
import StepRenderer from './target-audience-form/StepRenderer';
import { formSchema, FormValues, TargetAudienceFormProps } from './target-audience-form/types';
import { validateStep } from './target-audience-form/validation-utils';
import { submitTargetAudienceForm } from './target-audience-form/submission-utils';

const TOTAL_STEPS = 13;

const TargetAudienceForm = ({ onSubmit, onCancel, onBack }: TargetAudienceFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ageRange: '',
      gender: '',
      competitors: ['', '', ''],
      language: '',
      biography: '',
      beliefs: '',
      pains: ['', '', '', '', ''],
      desires: ['', '', '', '', ''],
      mainOffer: '',
      offerDetails: '',
      benefits: ['', '', '', '', ''],
      whyItWorks: '',
      experience: '',
    },
    mode: 'onChange',
  });

  const goToNextStep = async () => {
    try {
      const isValid = await validateStep(currentStep, form);

      if (isValid) {
        if (currentStep < TOTAL_STEPS) {
          setCurrentStep(currentStep + 1);
        } else {
          // Submit the form if we're on the last step
          await handleFormSubmission();
        }
      }
      // Removed toast notification for validation errors - errors will show inline
    } catch (error) {
      console.error("Validation error:", error);
      toast.error('Wystąpił błąd podczas walidacji');
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const handleFormSubmission = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      const data = form.getValues();
      console.log("Dane formularza przed wysłaniem:", data);
      await handleSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error('Wystąpił błąd podczas wysyłania formularza');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (data: FormValues) => {
    try {
      if (!user) {
        console.error("No user found in auth context");
        toast.error('Nie jesteś zalogowany lub sesja wygasła');
        return;
      }
      
      const userId = user.id;
      console.log("Submitting form with user ID:", userId);
      
      // Generujemy losową nazwę grupy docelowej, jeśli nie została podana
      const audienceName = `Grupa ${Math.floor(Math.random() * 1000) + 1}`;
      const formDataWithName = {
        ...data,
        name: audienceName
      };
      
      // Submit the form data using the utility function
      console.log("Dane do zapisania w bazie:", formDataWithName);
      const targetAudienceId = await submitTargetAudienceForm(formDataWithName, userId);
      console.log("Form submitted, target audience ID:", targetAudienceId);
      
      // Dodajemy małe opóźnienie przed wywołaniem onSubmit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sprawdzamy, czy rekord został faktycznie zapisany w bazie
      if (targetAudienceId) {
        const { data: checkData, error: checkError } = await supabase
          .from('target_audiences')
          .select('id')
          .eq('id', targetAudienceId)
          .single();
          
        if (checkError || !checkData) {
          console.error("Verification failed, record not saved properly:", checkError);
          toast.error('Błąd podczas weryfikacji zapisu danych');
          
          // Mimo błędu weryfikacji, próbujemy kontynuować
          onSubmit(formDataWithName, targetAudienceId);
        } else {
          console.log("Record verified in database:", checkData);
          toast.success('Dane grupy docelowej zostały zapisane');
          onSubmit(formDataWithName, targetAudienceId);
        }
      } else {
        // Fallback dla braku ID
        toast.warning('Brak ID grupy docelowej, używam tymczasowego ID');
        const tempId = crypto.randomUUID();
        onSubmit(formDataWithName, tempId);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error('Wystąpił błąd podczas wysyłania formularza');
      
      // Mimo błędu, próbujemy kontynuować z tymczasowym ID
      const tempId = crypto.randomUUID();
      onSubmit(data, tempId);
    }
  };

  // Handle Enter key press to navigate to the next step
  const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      goToNextStep();
    }
  };

  const onFormSubmit = form.handleSubmit(async (data) => {
    await handleSubmit(data);
  });

  return (
    <TooltipProvider>
      <StepContainer 
        currentStep={currentStep} 
        form={form} 
        handleKeyDown={handleKeyDown}
        onSubmit={onFormSubmit}
      >
        <StepRenderer currentStep={currentStep} form={form} />
      </StepContainer>
      
      <NavigationControls 
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        goToPreviousStep={goToPreviousStep}
        goToNextStep={goToNextStep}
        setCurrentStep={setCurrentStep}
        isLastStep={currentStep === TOTAL_STEPS}
      />
    </TooltipProvider>
  );
};

export default TargetAudienceForm;
