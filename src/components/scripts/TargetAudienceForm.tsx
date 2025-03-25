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
      let isValid = false;
      
      // Define validation logic based on current step
      switch (currentStep) {
        case 1:
          isValid = await form.trigger('ageRange');
          break;
        case 2:
          isValid = await form.trigger('gender');
          break;
        case 3:
          // Validate all three competitor fields
          isValid = await form.trigger('competitors');
          // Additional check for each individual competitor field
          const competitors = form.getValues('competitors');
          if (competitors.some(comp => !comp || comp.trim() === '')) {
            isValid = false;
            form.setError('competitors', {
              type: 'manual',
              message: 'Proszę wypełnić wszystkie pola konkurentów'
            });
          }
          break;
        case 4:
          isValid = await form.trigger('language');
          break;
        case 5:
          isValid = await form.trigger('biography');
          break;
        case 6:
          isValid = await form.trigger('beliefs');
          break;
        case 7:
          // Validate all pain fields
          isValid = await form.trigger('pains');
          const pains = form.getValues('pains');
          if (pains.some(pain => !pain || pain.trim() === '')) {
            isValid = false;
            form.setError('pains', {
              type: 'manual',
              message: 'Proszę wypełnić wszystkie pola problemów'
            });
          }
          break;
        case 8:
          // Validate all desire fields
          isValid = await form.trigger('desires');
          const desires = form.getValues('desires');
          if (desires.some(desire => !desire || desire.trim() === '')) {
            isValid = false;
            form.setError('desires', {
              type: 'manual',
              message: 'Proszę wypełnić wszystkie pola pragnień'
            });
          }
          break;
        case 9:
          isValid = await form.trigger('mainOffer');
          break;
        case 10:
          isValid = await form.trigger('offerDetails');
          break;
        case 11:
          // Validate all benefit fields
          isValid = await form.trigger('benefits');
          const benefits = form.getValues('benefits');
          if (benefits.some(benefit => !benefit || benefit.trim() === '')) {
            isValid = false;
            form.setError('benefits', {
              type: 'manual',
              message: 'Proszę wypełnić wszystkie pola korzyści'
            });
          }
          break;
        case 12:
          isValid = await form.trigger('whyItWorks');
          break;
        case 13:
          isValid = await form.trigger('experience');
          break;
        default:
          break;
      }

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
      // Auto-generate a name for the target audience if not provided
      const audienceName = `Grupa docelowa - ${data.ageRange}, ${data.gender}`;
      
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
      
      // Insert data into Supabase
      const { data: insertedData, error } = await supabase
        .from('target_audiences')
        .insert({
          name: audienceName,
          user_id: userId,
          age_range: data.ageRange,
          gender: data.gender,
          competitors: data.competitors,
          language: data.language,
          biography: data.biography,
          beliefs: data.beliefs,
          pains: data.pains,
          desires: data.desires,
          main_offer: data.mainOffer,
          offer_details: data.offerDetails,
          benefits: data.benefits,
          why_it_works: data.whyItWorks,
          experience: data.experience
        })
        .select();
      
      if (error) {
        console.error("Error saving to Supabase:", error);
        toast.error('Wystąpił błąd podczas zapisywania danych');
        return;
      }
      
      console.log("Data saved to Supabase:", insertedData);
      toast.success('Dane zostały zapisane');
      
      // Pass the created audience ID to the parent component
      if (insertedData && insertedData.length > 0) {
        onSubmit(data, insertedData[0].id);
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
