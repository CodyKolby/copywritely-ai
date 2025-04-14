
import { useState, useCallback } from 'react';
import { AudienceChoice } from '../types';
import { useQuery } from '@tanstack/react-query';
import { fetchExistingAudiences } from '../api';

/**
 * Hook for managing audience selection
 */
export const useAudienceSelection = (userId: string, open: boolean) => {
  // State for audience selection
  const [audienceChoice, setAudienceChoice] = useState<AudienceChoice>(null);
  const [selectedAudienceId, setSelectedAudienceId] = useState<string | null>(null);

  // Fetch existing target audiences
  const { data: existingAudiences = [], isLoading } = useQuery({
    queryKey: ['targetAudiences', userId],
    queryFn: () => fetchExistingAudiences(userId),
    enabled: !!userId && open,
    staleTime: 30000, // 30 seconds
  });

  // Handle audience choice selection
  const handleChoiceSelection = useCallback((choice: AudienceChoice) => {
    setAudienceChoice(choice);
    if (choice === 'new') {
      setSelectedAudienceId(null);
    }
  }, []);

  // Handle existing audience selection
  const handleExistingAudienceSelect = useCallback((id: string) => {
    setSelectedAudienceId(id);
  }, []);

  // Reset state function
  const resetAudienceSelection = useCallback(() => {
    setAudienceChoice(null);
    setSelectedAudienceId(null);
  }, []);

  return {
    audienceChoice,
    setAudienceChoice,
    selectedAudienceId,
    setSelectedAudienceId,
    existingAudiences,
    isLoading,
    handleChoiceSelection,
    handleExistingAudienceSelect,
    resetAudienceSelection
  };
};
