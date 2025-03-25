
import React, { useState, KeyboardEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';

// Import refactored components
import StepContainer from './target-audience-form/StepContainer';
import NavigationControls from './target-audience-form/NavigationControls';
import StepRenderer from './target-audience-form/StepRenderer';
import { formSchema, FormValues, TargetAudienceFormProps } from './target-audience-form/types';

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
    // Define which field(s) to validate for each step
    const stepValidations: Record<number, string[]> = {
      1: ['ageRange'],
      2: ['gender'],
      3: ['competitors'],
      4: ['language'],
      5: ['biography'],
      6: ['beliefs'],
      7: ['pains'],
      8: ['desires'],
      9: ['mainOffer'],
      10: ['offerDetails'],
      11: ['benefits'],
      12: ['whyItWorks'],
      13: ['experience'],
    };

    const fieldsToValidate = stepValidations[currentStep];
    
    try {
      // Trigger validation for all fields in the current step
      const isValid = await form.trigger(fieldsToValidate as any);
      
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

  const handleSubmit = (data: FormValues) => {
    onSubmit(data);
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
