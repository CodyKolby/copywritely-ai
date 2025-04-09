
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HookSelectorProps {
  currentIndex: number;
  totalHooks: number;
  onHookSelect: (index: number) => void;
}

const HookSelector = ({ 
  currentIndex, 
  totalHooks,
  onHookSelect
}: HookSelectorProps) => {
  const handlePrevious = () => {
    if (currentIndex > 0) {
      onHookSelect(currentIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (currentIndex < totalHooks - 1) {
      onHookSelect(currentIndex + 1);
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        disabled={currentIndex === 0}
        onClick={handlePrevious}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <span className="text-sm text-gray-600 min-w-[60px] text-center">
        {currentIndex + 1} / {totalHooks}
      </span>
      
      <Button
        variant="outline"
        size="icon"
        disabled={currentIndex === totalHooks - 1}
        onClick={handleNext}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default HookSelector;
