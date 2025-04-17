
import React, { useEffect } from 'react';
import { BadgePlus } from 'lucide-react';

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
  // Log subject lines to console for debugging
  useEffect(() => {
    console.log("Subject lines received by SubjectLineToggle component:", {
      subject1: currentSubject,
      subject2: alternativeSubject,
      currentlyShowing: isShowingAlternative ? "Alternative" : "Primary",
      timestamp: new Date().toISOString()
    });
  }, [currentSubject, alternativeSubject, isShowingAlternative]);
  
  return (
    <div className="mb-4 p-4 rounded-lg border border-amber-200 bg-amber-50">
      <div className="flex flex-col space-y-3">
        <div className="flex items-center">
          <BadgePlus className="w-4 h-4 mr-2 text-amber-700" />
          <h3 className="text-sm font-medium text-amber-800">
            Alternatywne tytuły emaila (A/B Test)
          </h3>
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
      </div>
    </div>
  );
};

export default SubjectLineToggle;
