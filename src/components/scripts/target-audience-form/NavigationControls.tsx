
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
      // Jeśli to ostatni krok, wywołaj onSubmit, w przeciwnym razie przejdź do następnego kroku
      if (isLastStep) {
        // Przycisk submit wywoła onSubmit dzięki formie
        const form = document.querySelector('form');
        if (form) {
          form.requestSubmit();
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
          type="button" // Zmiana na button type
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
