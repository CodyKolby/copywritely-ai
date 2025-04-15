
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Import hooks
import { usePremiumVerification } from '@/hooks/usePremiumVerification';
import { useTemplateSelection } from '@/components/scripts/hooks/useTemplateSelection';

// Import components
import ScriptTemplateGrid from '@/components/scripts/ScriptTemplateGrid';
import TargetAudienceDialog from '@/components/scripts/TargetAudienceDialog';

// Types and templates
import { scriptTemplates } from '@/data/scriptTemplates';

const ScriptGenerator = () => {
  const { user, isPremium, refreshSession } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [directPremiumCheck, setDirectPremiumCheck] = useState<boolean | null>(null);
  
  // Use custom hooks
  const premiumVerification = usePremiumVerification();
  const templateSelection = useTemplateSelection(checkPremiumStatus);

  // Direct check for premium status
  const checkPremiumDirectly = useCallback(async (userId: string): Promise<boolean> => {
    try {
      console.log(`[ScriptGenerator] Checking premium status directly for: ${userId}`);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_premium, subscription_status, subscription_expiry')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('[ScriptGenerator] Error checking premium directly:', error);
        return false;
      }
      
      if (profile && profile.is_premium === true) {
        // Check expiry date if available
        if (profile.subscription_expiry) {
          const now = new Date();
          const expiry = new Date(profile.subscription_expiry);
          if (expiry < now) {
            console.log('[ScriptGenerator] Premium expired:', profile.subscription_expiry);
            return false;
          }
        }
        
        console.log('[ScriptGenerator] User has premium status:', profile);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[ScriptGenerator] Error checking premium directly:', error);
      return false;
    }
  }, []);

  // Consolidated function to check premium status
  async function checkPremiumStatus(): Promise<boolean> {
    if (!user?.id) {
      toast.error('Wymagane jest zalogowanie', {
        description: 'Zaloguj się, aby kontynuować.',
      });
      return false;
    }
    
    try {
      // Try direct database check first (most reliable)
      const directCheck = await checkPremiumDirectly(user.id);
      if (directCheck) {
        console.log('[ScriptGenerator] Direct DB check confirms premium status');
        setDirectPremiumCheck(true);
        return true;
      }
      
      // Fall back to verification hook
      const verificationResult = await premiumVerification.validatePremiumStatus();
      
      if (verificationResult) {
        console.log('[ScriptGenerator] Premium verification succeeds');
        setDirectPremiumCheck(true);
        return true;
      }
      
      console.log('[ScriptGenerator] Premium verification failed, user does not have premium');
      setDirectPremiumCheck(false);
      return false;
    } catch (error) {
      console.error('[ScriptGenerator] Error verifying premium status:', error);
      setDirectPremiumCheck(false);
      return false;
    }
  }

  // On mount, scroll to top and refresh auth if needed
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Try to refresh session once when page loads to ensure latest auth state
    const attemptRefresh = async () => {
      if (user?.id) {
        console.log("Script generator - attempting session refresh");
        setIsRefreshing(true);
        try {
          await refreshSession();
          // After refreshing, verify premium status
          if (user.id) {
            await checkPremiumStatus();
          }
        } catch (e) {
          console.error("Error refreshing session:", e);
        } finally {
          setIsRefreshing(false);
        }
      }
    };
    
    attemptRefresh();
  }, [user?.id, refreshSession]);
  
  // Check premium status directly when user changes
  useEffect(() => {
    const verifyPremium = async () => {
      if (user?.id) {
        try {
          const result = await checkPremiumDirectly(user.id);
          setDirectPremiumCheck(result);
        } catch (e) {
          console.error('Error in direct premium check:', e);
        }
      } else {
        setDirectPremiumCheck(null);
      }
    };
    
    verifyPremium();
  }, [user?.id, checkPremiumDirectly]);
  
  // Log state for debugging
  useEffect(() => {
    console.log("Script generator page state:", {
      userAuth: !!user,
      userId: user?.id,
      isPremium: premiumVerification.isPremium,
      isCheckingPremium: premiumVerification.isCheckingPremium,
      directPremiumCheck,
      currentTemplateId: templateSelection.currentTemplateId,
      dialogOpen: templateSelection.targetAudienceDialogOpen
    });
  }, [
    user, 
    premiumVerification.isPremium, 
    premiumVerification.isCheckingPremium,
    directPremiumCheck,
    templateSelection.currentTemplateId, 
    templateSelection.targetAudienceDialogOpen
  ]);
  
  // Handle dialog closed - recheck premium status and reset templateId if needed
  const handleDialogOpenChange = (open: boolean) => {
    console.log(`Dialog ${open ? 'opening' : 'closing'} - handling change`, {
      currentDialogState: templateSelection.targetAudienceDialogOpen,
      currentTemplateId: templateSelection.currentTemplateId
    });
    
    templateSelection.handleDialogOpenChange(open);
    
    // When dialog is closed, perform cleanup
    if (!open) {
      // Revalidate premium after dialog closes
      if (user?.id) {
        console.log("Revalidating premium status after dialog close");
        checkPremiumStatus();
      }
    }
  };
  
  // Create a handler for template selection that logs details
  const handleTemplateSelect = (templateId: string) => {
    if (!user) {
      toast.error('Wymagane jest zalogowanie', {
        description: 'Zaloguj się, aby kontynuować.',
      });
      return;
    }
    
    console.log(`Template ${templateId} selected, current state:`, {
      userId: user?.id,
      isPremium: premiumVerification.isPremium,
      directPremiumCheck,
      isCheckingPremium: premiumVerification.isCheckingPremium
    });
    
    templateSelection.handleTemplateSelect(templateId);
  };

  // Determine if we should show the premium feature alert
  const shouldShowPremiumAlert = !directPremiumCheck && 
                                !isPremium && 
                                !premiumVerification.isPremium && 
                                !premiumVerification.isCheckingPremium && 
                                !isRefreshing;

  return (
    <div className="pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Generator Skryptów AI
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Twórz skrypty, które zwiększają sprzedaż i budują Twoją markę osobistą. Wybierz szablon i zacznij działać.
          </p>
        </motion.div>

        {shouldShowPremiumAlert && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Alert variant="premium" className="rounded-none">
              <ExclamationTriangleIcon className="h-5 w-5 text-white" />
              <AlertTitle className="text-white text-xl font-semibold">Funkcja premium</AlertTitle>
              <AlertDescription className="text-white">
                Generowanie skryptów jest funkcją premium. Możesz przeglądać szablony, ale tworzenie skryptów wymaga konta premium.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <ScriptTemplateGrid 
          templates={scriptTemplates}
          onSelectTemplate={handleTemplateSelect}
        />

        {user?.id && (
          <TargetAudienceDialog
            key={`dialog-${templateSelection.currentTemplateId || 'default'}`}
            open={templateSelection.targetAudienceDialogOpen}
            onOpenChange={handleDialogOpenChange}
            templateId={templateSelection.currentTemplateId}
            userId={user?.id}
            isPremium={!!directPremiumCheck || isPremium || premiumVerification.isPremium}
          />
        )}
      </div>
    </div>
  );
};

export default ScriptGenerator;
