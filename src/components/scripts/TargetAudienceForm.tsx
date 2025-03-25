
import React, { useState, KeyboardEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client'; 

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
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ageRange: '',
      gender: 'any',
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
          form.handleSubmit(handleSubmit)();
        }
      } else {
        // Show error toast if validation fails
        toast.error('Proszę uzupełnić wszystkie wymagane pola');
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

  const handleSubmit = async (data: FormValues) => {
    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Error getting user:", userError);
        toast.error('Wystąpił błąd podczas identyfikacji użytkownika');
        return;
      }
      
      const userId = userData.user?.id;
      
      if (!userId) {
        console.error("No user ID found");
        toast.error('Nie znaleziono identyfikatora użytkownika');
        return;
      }
      
      // Submit the form data using the utility function
      const targetAudienceId = await submitTargetAudienceForm(data, userId);
      
      // Call the onSubmit callback with the form data and the created audience ID
      if (targetAudienceId) {
        onSubmit(data, targetAudienceId);
      } else {
        onSubmit(data);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error('Wystąpił błąd podczas wysyłania formularza');
    }
  };

  // Handle Enter key press to navigate to the next step
  const handleKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      goToNextStep();
    }
  };

  return (
    <TooltipProvider>
      <StepContainer 
        currentStep={currentStep} 
        form={form} 
        handleKeyDown={handleKeyDown}
      >
        <StepRenderer currentStep={currentStep} form={form} />
      </StepContainer>
      
      <NavigationControls 
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        goToPreviousStep={goToPreviousStep}
        goToNextStep={goToNextStep}
        setCurrentStep={setCurrentStep}
      />
    </TooltipProvider>
  );
};

export default TargetAudienceForm;
