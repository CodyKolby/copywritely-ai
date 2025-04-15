
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for managing template selection and dialog state
 */
export function useTemplateSelection(validatePremium?: () => Promise<boolean>) {
  const [targetAudienceDialogOpen, setTargetAudienceDialogOpen] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidatingPremium, setIsValidatingPremium] = useState(false);
  const navigate = useNavigate();
  const { user, isPremium, refreshSession } = useAuth();

  // Reset dialog state when not open to prevent stale data
  useEffect(() => {
    if (!targetAudienceDialogOpen) {
      // Small delay to prevent issues during closing animation
      const timeout = setTimeout(() => {
        if (!targetAudienceDialogOpen) {
          setCurrentTemplateId(null);
          setValidationError(null);
        }
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [targetAudienceDialogOpen]);

  // Direct check for premium status from database
  const checkPremiumDirectly = useCallback(async (userId: string): Promise<boolean> => {
    try {
      console.log(`[Template Selection] Checking premium status directly for: ${userId}`);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_premium, subscription_status, subscription_expiry')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('[Template Selection] Error checking premium status:', error);
        return false;
      }
      
      if (profile && profile.is_premium === true) {
        // Check expiry date if available
        if (profile.subscription_expiry) {
          const now = new Date();
          const expiry = new Date(profile.subscription_expiry);
          if (expiry < now) {
            console.log('[Template Selection] Premium expired:', profile.subscription_expiry);
            return false;
          }
        }
        
        console.log('[Template Selection] User has premium status:', profile);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[Template Selection] Error checking premium directly:', error);
      return false;
    }
  }, []);

  // Handle template selection
  const handleTemplateSelect = useCallback(async (templateId: string) => {
    console.log(`Template selected: ${templateId}`, { isAuthenticated: !!user });
    
    // Check if user is authenticated first
    if (!user) {
      console.log('User not authenticated, redirecting to login');
      toast.error('Wymagane jest zalogowanie', {
        description: 'Zaloguj się, aby kontynuować.',
        action: {
          label: 'Zaloguj',
          onClick: () => navigate('/login')
        }
      });
      return;
    }
    
    // Set the current template ID
    setCurrentTemplateId(templateId);
    
    // If we need to validate premium, do it first
    if (validatePremium) {
      try {
        setIsValidatingPremium(true);
        setValidationError(null);
        console.log('Validating premium status for user:', user.id);
        
        // Try direct check first
        const directPremium = await checkPremiumDirectly(user.id);
        
        if (directPremium) {
          console.log('Premium confirmed via direct check');
          setIsValidatingPremium(false);
          setTargetAudienceDialogOpen(true);
          return;
        }
        
        // If direct check fails, try validation function
        const isPremium = await validatePremium();
        
        if (!isPremium) {
          console.log('User does not have premium, redirecting to pricing');
          setIsValidatingPremium(false);
          toast.error('Ta funkcja wymaga konta Premium', {
            description: 'Przejdź do strony cennika, aby wykupić subskrypcję.',
            action: {
              label: 'Cennik',
              onClick: () => navigate('/pricing')
            }
          });
          setCurrentTemplateId(null);
          return;
        }
        
        setIsValidatingPremium(false);
        
        // Open the dialog with a slight delay
        console.log('Opening target audience dialog...');
        setTimeout(() => {
          setTargetAudienceDialogOpen(true);
        }, 100);
      } catch (error) {
        console.error('Error validating premium status:', error);
        setValidationError('Błąd weryfikacji statusu premium');
        setIsValidatingPremium(false);
        
        toast.error('Błąd weryfikacji statusu premium', {
          description: 'Prosimy odświeżyć stronę i spróbować ponownie.'
        });
        return;
      }
    } else {
      // Open the dialog with a slight delay
      console.log('Opening target audience dialog (no premium check needed)...');
      setTimeout(() => {
        setTargetAudienceDialogOpen(true);
      }, 100);
    }
    
  }, [validatePremium, navigate, user, checkPremiumDirectly]);

  // Handle dialog open state changes
  const handleDialogOpenChange = useCallback((open: boolean) => {
    console.log(`Dialog open state changed to: ${open}`);
    setTargetAudienceDialogOpen(open);
    
    // If dialog is closed without completing the flow, reset template ID
    if (!open) {
      console.log('Dialog closed, resetting template ID');
      // Small delay to allow for closing animation
      setTimeout(() => {
        setCurrentTemplateId(null);
        setValidationError(null);
      }, 300);
    }
  }, []);

  return {
    targetAudienceDialogOpen,
    currentTemplateId,
    isValidatingPremium,
    validationError,
    handleTemplateSelect,
    handleDialogOpenChange
  };
}
