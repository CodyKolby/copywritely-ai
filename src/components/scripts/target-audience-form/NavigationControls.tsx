
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination';

interface NavigationControlsProps {
  currentStep: number;
  totalSteps: number;
  goToPreviousStep: () => void;
  goToNextStep: () => void;
  setCurrentStep: (step: number) => void;
}

const NavigationControls = ({
  currentStep,
  totalSteps,
  goToPreviousStep,
  goToNextStep,
  setCurrentStep,
}: NavigationControlsProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button type="button" variant="outline" onClick={goToPreviousStep}>
          {currentStep === 1 ? 'Wróć' : 'Poprzedni krok'}
        </Button>

        <div className="text-sm text-gray-500">
          Krok {currentStep} z {totalSteps}
        </div>

        <Button type="button" onClick={goToNextStep}>
          {currentStep === totalSteps ? 'Zapisz i kontynuuj' : 'Następny krok'}
        </Button>
      </div>

      <Pagination>
        <PaginationContent>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <PaginationItem key={index}>
              <PaginationLink
                isActive={currentStep === index + 1}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentStep(index + 1);
                }}
              >
                {index + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default NavigationControls;
