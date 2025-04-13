
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
      advertisingGoal: '',
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
          // Validate all fields before submission
          const allValid = await form.trigger();
          if (allValid) {
            await handleFormSubmission();
          } else {
            toast.error('Proszę poprawić błędy w formularzu');
          }
        }
      }
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
      console.log("Submitting form on last step");
      await handleSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error('Wystąpił błąd podczas wysyłania formularza');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (data: FormValues) => {
    try {
      if (!user) {
        console.error("No user found in auth context");
        toast.error('Nie jesteś zalogowany lub sesja wygasła');
        setIsSubmitting(false);
        return;
      }
      
      const userId = user.id;
      console.log("Submitting form with user ID:", userId);
      
      const audienceName = `Grupa ${Math.floor(Math.random() * 1000) + 1}`;
      const formDataWithName = {
        ...data,
        name: audienceName
      };
      
      console.log("Dane do zapisania w bazie:", formDataWithName);
      
      try {
        // CRITICAL FIX: Remove advertisingGoal which doesn't exist in the database
        const { advertisingGoal, ...dataToSubmit } = formDataWithName;
        console.log("Data being submitted (without advertisingGoal):", dataToSubmit);
        
        // Directly use submitTargetAudienceForm function for submission
        const targetAudienceId = await submitTargetAudienceForm(dataToSubmit, userId);
        console.log("Form submitted, target audience ID:", targetAudienceId);
        
        if (targetAudienceId) {
          toast.success("Grupa docelowa została utworzona pomyślnie!");
          // Call the onSubmit function with the target audience ID and full form data (including advertisingGoal)
          // This is OK because advertisingGoal is only removed for database storage
          onSubmit(formDataWithName, targetAudienceId);
        } else {
          toast.error('Wystąpił błąd podczas zapisywania grupy docelowej');
          setIsSubmitting(false);
        }
      } catch (submitError: any) {
        console.error("Error in submitTargetAudienceForm:", submitError);
        toast.error(`Błąd podczas zapisywania danych: ${submitError.message || 'Nieznany błąd'}`);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error('Wystąpił błąd podczas wysyłania formularza');
      setIsSubmitting(false);
    }
  };

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
        isSubmitting={isSubmitting}
      />
    </TooltipProvider>
  );
};

export default TargetAudienceForm;
