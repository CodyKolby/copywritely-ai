
import React, { useState, KeyboardEvent } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { TooltipProvider } from '@/components/ui/tooltip';

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
    // Check validity of current step
    let isValid = true;

    switch (currentStep) {
      case 1: // Age Range
        isValid = await form.trigger('ageRange');
        break;
      case 2: // Gender
        isValid = await form.trigger('gender');
        break;
      case 3: // Competitors
        isValid = await form.trigger('competitors');
        break;
      case 4: // Language
        isValid = await form.trigger('language');
        break;
      case 5: // Biography
        isValid = await form.trigger('biography');
        break;
      case 6: // Beliefs
        isValid = await form.trigger('beliefs');
        break;
      case 7: // Pains
        isValid = await form.trigger('pains');
        break;
      case 8: // Desires
        isValid = await form.trigger('desires');
        break;
      case 9: // Main Offer
        isValid = await form.trigger('mainOffer');
        break;
      case 10: // Offer Details
        isValid = await form.trigger('offerDetails');
        break;
      case 11: // Benefits
        isValid = await form.trigger('benefits');
        break;
      case 12: // Why It Works
        isValid = await form.trigger('whyItWorks');
        break;
      case 13: // Experience
        isValid = await form.trigger('experience');
        break;
    }

    if (isValid) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1);
      } else {
        // Submit the form if we're on the last step
        form.handleSubmit(handleSubmit)();
      }
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
