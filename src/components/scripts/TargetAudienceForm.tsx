
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
import { supabase } from '@/integrations/supabase/client';

const TOTAL_STEPS = 13;

const TargetAudienceForm = ({ onSubmit, onCancel, onBack }: TargetAudienceFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Track if we've already created an audience to prevent duplicates
  const [hasCreatedAudience, setHasCreatedAudience] = useState(false);
  
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
    if (isSubmitting || hasCreatedAudience) {
      console.log("Already submitted, preventing duplicate submission");
      return;
    }
    
    try {
      setIsSubmitting(true);
      const data = form.getValues();
      console.log("Submitting form on last step with data:", data);
      
      if (!user?.id) {
        console.error("No user ID available for form submission");
        toast.error("Musisz być zalogowany, aby zapisać grupę docelową");
        return;
      }
      
      // Mark as having created an audience to prevent duplicates
      setHasCreatedAudience(true);
      
      // Direct database approach - more reliable than delegation
      try {
        // Generate a name based on the form data
        const audienceName = `Grupa ${Math.floor(Math.random() * 10000)}`;
        
        // Prepare data for database insertion
        const dbData = {
          user_id: user.id,
          name: audienceName,
          age_range: data.ageRange,
          gender: data.gender,
          competitors: data.competitors.filter(Boolean),
          language: data.language,
          biography: data.biography,
          beliefs: data.beliefs,
          pains: data.pains.filter(Boolean),
          desires: data.desires.filter(Boolean),
          main_offer: data.mainOffer,
          offer_details: data.offerDetails,
          benefits: data.benefits.filter(Boolean),
          why_it_works: data.whyItWorks,
          experience: data.experience
        };
        
        console.log("Direct database insertion with data:", dbData);
        
        // Insert directly into the database
        const { data: insertData, error } = await supabase
          .from('target_audiences')
          .insert(dbData)
          .select('id')
          .single();
          
        if (error) {
          console.error("Database insertion error:", error);
          toast.error("Błąd podczas zapisywania do bazy danych");
          setHasCreatedAudience(false); // Reset flag to allow retry
          
          // Try the onSubmit prop as a fallback
          const audienceId = await onSubmit(data);
          console.log("Fallback onSubmit returned:", audienceId);
          return audienceId;
        }
        
        if (insertData && insertData.id) {
          console.log("Direct database insert successful with ID:", insertData.id);
          toast.success("Grupa docelowa została utworzona");
          
          // Call onSubmit with the ID to ensure parent components are updated
          await onSubmit(data);
          
          return insertData.id;
        } else {
          console.error("No ID returned from direct database insert");
          setHasCreatedAudience(false); // Reset flag to allow retry
          
          // Try the onSubmit prop as a last resort
          return await onSubmit(data);
        }
      } catch (directDbError) {
        console.error("Direct database approach failed:", directDbError);
        setHasCreatedAudience(false); // Reset flag to allow retry
        
        // Fall back to the provided onSubmit function
        return await onSubmit(data);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error('Wystąpił błąd podczas wysyłania formularza');
      setHasCreatedAudience(false); // Reset flag to allow retry
      return undefined;
    } finally {
      setIsSubmitting(false);
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
