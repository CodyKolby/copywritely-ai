
import React, { useState, KeyboardEvent, useRef } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

const TOTAL_STEPS = 13;

const TargetAudienceForm = ({ onSubmit, onCancel, onBack }: TargetAudienceFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Track if we've already created an audience to prevent duplicates
  const hasCreatedAudienceRef = useRef(false);
  
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
    // Prevent double submission
    if (isSubmitting || hasCreatedAudienceRef.current) {
      console.log("Already submitted or submitting, preventing duplicate submission");
      return;
    }
    
    try {
      setIsSubmitting(true);
      hasCreatedAudienceRef.current = true;
      
      const data = form.getValues();
      console.log("Submitting form on last step with data:", data);
      
      if (!user?.id) {
        console.error("No user ID available for form submission");
        toast.error("Musisz być zalogowany, aby zapisać grupę docelową");
        return;
      }
      
      // Attempt to use the onSubmit prop
      try {
        console.log("Calling parent onSubmit function");
        const audienceId = await onSubmit(data);
        
        if (audienceId) {
          console.log("Form submission successful with audience ID:", audienceId);
          // success already handled by parent
        } else {
          console.warn("No audience ID returned from onSubmit");
        }
      } catch (error) {
        console.error("Error calling parent onSubmit:", error);
        toast.error("Wystąpił błąd podczas zapisywania");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error('Wystąpił błąd podczas wysyłania formularza');
    } finally {
      // Reset submission state after a delay
      setTimeout(() => {
        setIsSubmitting(false);
        // Only reset the flag after a longer delay to prevent accidental double submissions
        setTimeout(() => {
          hasCreatedAudienceRef.current = false;
        }, 5000);
      }, 1000);
    }
  };

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
        onSubmit={form.handleSubmit(handleFormSubmission)}
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
