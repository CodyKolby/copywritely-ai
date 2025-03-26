
import React from 'react';
import { Button } from '@/components/ui/button';

interface NavigationControlsProps {
  currentStep: number;
  totalSteps: number;
  goToPreviousStep: () => void;
  goToNextStep: () => void;
  setCurrentStep: (step: number) => void;
  isLastStep?: boolean;
}

const NavigationControls = ({
  currentStep,
  totalSteps,
  goToPreviousStep,
  goToNextStep,
  setCurrentStep,
  isLastStep = false,
}: NavigationControlsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button 
          type="button" 
          variant="outline" 
          onClick={goToPreviousStep}
          className="text-gray-700"
        >
          {currentStep === 1 ? 'Wróć' : 'Poprzedni krok'}
        </Button>

        <div className="text-sm text-gray-500">
          Krok {currentStep} z {totalSteps}
        </div>

        <Button 
          type={isLastStep ? "submit" : "button"} 
          onClick={isLastStep ? undefined : goToNextStep}
          className="bg-copywrite-teal hover:bg-copywrite-teal-dark text-white"
        >
          {isLastStep ? 'Zapisz i kontynuuj' : 'Następny krok'}
        </Button>
      </div>
    </div>
  );
};

export default NavigationControls;
