
import React from 'react';
import { Button } from '@/components/ui/button';
import { BadgePlus, SwitchIcon } from 'lucide-react';

interface SubjectLineToggleProps {
  currentSubject: string;
  alternativeSubject: string;
  isShowingAlternative: boolean;
  onToggle: () => void;
}

const SubjectLineToggle = ({
  currentSubject,
  alternativeSubject,
  isShowingAlternative,
  onToggle
}: SubjectLineToggleProps) => {
  return (
    <div className="mb-4 p-4 rounded-lg border border-amber-200 bg-amber-50">
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <BadgePlus className="w-4 h-4 mr-2 text-amber-700" />
            <h3 className="text-sm font-medium text-amber-800">
              Alternatywne tytuły emaila (A/B Test)
            </h3>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onToggle}
            className="text-xs border-amber-300 hover:bg-amber-100 text-amber-700"
          >
            <SwitchIcon className="w-3 h-3 mr-1" />
            Zamień
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className={`p-3 rounded-md border ${!isShowingAlternative ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <p className="text-sm font-medium">
              {!isShowingAlternative ? '✓ Aktualny' : 'Alternatywny'}
            </p>
            <p className="text-sm mt-1">{currentSubject}</p>
          </div>
          
          <div className={`p-3 rounded-md border ${isShowingAlternative ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <p className="text-sm font-medium">
              {isShowingAlternative ? '✓ Aktualny' : 'Alternatywny'}
            </p>
            <p className="text-sm mt-1">{alternativeSubject}</p>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-1">
          Możesz przełączyć między tytułami, aby wybrać ten, który bardziej odpowiada Twoim potrzebom.
        </p>
      </div>
    </div>
  );
};

export default SubjectLineToggle;
