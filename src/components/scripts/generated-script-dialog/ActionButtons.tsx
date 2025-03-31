
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ActionButtonsProps {
  isSaving: boolean;
  projectSaved: boolean;
  onSave: () => void;
  currentHookIndex: number;
  totalHooks: number;
  onGenerateNew: () => void;
  isGeneratingNewScript: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  isSaving,
  projectSaved,
  onSave,
  currentHookIndex,
  totalHooks,
  onGenerateNew,
  isGeneratingNewScript
}) => {
  return (
    <div className="flex justify-between mt-4">
      <button
        onClick={onSave}
        className={`px-4 py-2 rounded-md flex items-center gap-2 ${
          projectSaved
            ? "bg-gray-200 text-gray-600 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
        disabled={isSaving || projectSaved}
      >
        {isSaving ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Zapisywanie...</span>
          </>
        ) : projectSaved ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            <span>Zapisano</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>Zapisz w projektach</span>
          </>
        )}
      </button>
      
      {currentHookIndex + 1 < totalHooks && (
        <button 
          onClick={onGenerateNew}
          className="px-4 py-2 bg-copywrite-teal text-white rounded-md hover:bg-copywrite-teal-dark flex items-center gap-2"
          disabled={isGeneratingNewScript}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
          Wygeneruj nowy skrypt
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
