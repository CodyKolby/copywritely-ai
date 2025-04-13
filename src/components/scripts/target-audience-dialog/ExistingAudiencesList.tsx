
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HelpCircle, Trash2 } from 'lucide-react';
import { TargetAudience } from './types';

interface ExistingAudiencesListProps {
  isLoading: boolean;
  existingAudiences: TargetAudience[];
  selectedAudienceId: string | null;
  handleExistingAudienceSelect: (audienceId: string) => void;
  handleChoiceSelection: (choice: string) => void;
  handleCreateNewAudience: () => void;
  handleDeleteAudience?: (audienceId: string) => void;
}

const ExistingAudiencesList = ({
  isLoading,
  existingAudiences,
  selectedAudienceId,
  handleExistingAudienceSelect,
  handleChoiceSelection,
  handleCreateNewAudience,
  handleDeleteAudience,
}: ExistingAudiencesListProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copywrite-teal"></div>
      </div>
    );
  }

  return (
    <div className="mb-6 px-2">
      {existingAudiences.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <HelpCircle className="mx-auto h-12 w-12 opacity-50 mb-2" />
          <p>Nie masz jeszcze żadnych grup docelowych.</p>
        </div>
      ) : (
        <>
          <h3 className="font-medium text-lg mb-3">Istniejące grupy docelowe</h3>
          <ScrollArea className="h-[200px] w-full rounded-md border">
            <div className="space-y-2 p-4">
              {existingAudiences.map((audience) => (
                <div 
                  key={audience.id}
                  className={`flex items-center justify-between rounded-md p-4 transition-colors ${
                    selectedAudienceId === audience.id 
                      ? 'bg-copywrite-teal text-white' 
                      : 'bg-copywrite-teal-light text-copywrite-teal hover:bg-copywrite-teal hover:text-white'
                  }`}
                >
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      handleExistingAudienceSelect(audience.id);
                      handleChoiceSelection('existing');
                    }}
                  >
                    <span className="font-medium">{audience.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div 
                      className={`h-5 w-5 rounded-full border flex items-center justify-center cursor-pointer ${
                        selectedAudienceId === audience.id 
                          ? 'border-white bg-white/20' 
                          : 'border-copywrite-teal'
                      }`}
                      onClick={() => {
                        handleExistingAudienceSelect(audience.id);
                        handleChoiceSelection('existing');
                      }}
                    >
                      {selectedAudienceId === audience.id && (
                        <div className="h-3 w-3 rounded-full bg-white" />
                      )}
                    </div>
                    
                    {handleDeleteAudience && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAudience(audience.id);
                        }}
                        className={`p-1 rounded hover:bg-black/10 ${
                          selectedAudienceId === audience.id 
                            ? 'text-white' 
                            : 'text-copywrite-teal'
                        }`}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
      
      <div className="text-center mt-4">
        <button
          onClick={handleCreateNewAudience}
          className="text-copywrite-teal hover:text-copywrite-teal-dark font-medium underline transition-colors"
        >
          Stwórz nową grupę docelową
        </button>
      </div>
    </div>
  );
};

export default ExistingAudiencesList;
