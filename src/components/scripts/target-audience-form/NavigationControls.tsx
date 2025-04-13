
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface NavigationControlsProps {
  currentStep: number;
  totalSteps: number;
  goToPreviousStep: () => void;
  goToNextStep: () => void;
  setCurrentStep: (step: number) => void;
  isLastStep?: boolean;
  isSubmitting?: boolean;
}

const NavigationControls = ({
  currentStep,
  totalSteps,
  goToPreviousStep,
  goToNextStep,
  setCurrentStep,
  isLastStep = false,
  isSubmitting = false,
}: NavigationControlsProps) => {
  const handleSubmitOrNext = () => {
    if (!isSubmitting) {
      if (isLastStep) {
        // On last step, trigger the form submission
        const form = document.querySelector('form');
        if (form) {
          console.log("Submitting form on last step");
          
          try {
            // Use the requestSubmit method which is more reliable
            if (typeof form.requestSubmit === 'function') {
              form.requestSubmit();
            } else {
              // Fallback for older browsers
              const submitEvent = new Event('submit', { cancelable: true, bubbles: true });
              const wasSubmitted = form.dispatchEvent(submitEvent);
              
              if (!wasSubmitted) {
                console.log("Form submission was cancelled");
              }
            }
          } catch (e) {
            console.error("Error submitting form:", e);
            // Final fallback - look for submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
              (submitBtn as HTMLButtonElement).click();
            }
          }
        }
      } else {
        goToNextStep();
      }
    }
  };

  return (
    <div className="space-y-4 p-2 md:p-4">
      <div className="flex justify-between items-center">
        <Button 
          type="button" 
          variant="outline" 
          onClick={goToPreviousStep}
          className="text-gray-700"
          disabled={isSubmitting}
        >
          {currentStep === 1 ? 'Wróć' : 'Poprzedni krok'}
        </Button>

        <div className="text-sm text-gray-500">
          Krok {currentStep} z {totalSteps}
        </div>

        <Button 
          type="button"
          onClick={handleSubmitOrNext}
          className="bg-copywrite-teal hover:bg-copywrite-teal-dark text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Zapisywanie...
            </>
          ) : (
            isLastStep ? 'Zapisz i kontynuuj' : 'Następny krok'
          )}
        </Button>
      </div>
    </div>
  );
};

export default NavigationControls;
