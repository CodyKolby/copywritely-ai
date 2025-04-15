
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

/**
 * Hook for managing template selection and dialog state
 */
export function useTemplateSelection(validatePremium?: () => Promise<boolean>) {
  const [targetAudienceDialogOpen, setTargetAudienceDialogOpen] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Handle template selection
  const handleTemplateSelect = useCallback(async (templateId: string) => {
    console.log(`Template selected: ${templateId}`);
    
    // Set the current template ID
    setCurrentTemplateId(templateId);
    
    // If we need to validate premium, do it first
    if (validatePremium) {
      try {
        console.log('Validating premium status...');
        const isPremium = await validatePremium();
        
        if (!isPremium) {
          console.log('User does not have premium, redirecting to pricing');
          toast.error('Ta funkcja wymaga konta Premium', {
            description: 'Przejdź do strony cennika, aby wykupić subskrypcję.',
            action: {
              label: 'Cennik',
              onClick: () => navigate('/pricing')
            }
          });
          return;
        }
      } catch (error) {
        console.error('Error validating premium status:', error);
        toast.error('Błąd weryfikacji statusu premium', {
          description: 'Prosimy odświeżyć stronę i spróbować ponownie.'
        });
        return;
      }
    }
    
    // Open the dialog with a slight delay
    console.log('Opening target audience dialog...');
    setTimeout(() => {
      setTargetAudienceDialogOpen(true);
    }, 100);
    
  }, [validatePremium, navigate]);

  // Handle dialog open state changes
  const handleDialogOpenChange = useCallback((open: boolean) => {
    console.log(`Dialog open state changed to: ${open}`);
    setTargetAudienceDialogOpen(open);
    
    // If dialog is closed without completing the flow, reset template ID
    if (!open) {
      console.log('Dialog closed, resetting template ID');
      setCurrentTemplateId(null);
    }
  }, []);

  return {
    targetAudienceDialogOpen,
    currentTemplateId,
    handleTemplateSelect,
    handleDialogOpenChange
  };
}
