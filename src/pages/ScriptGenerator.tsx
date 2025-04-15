import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { usePremiumVerification } from '@/hooks/usePremiumVerification';
import { useTemplateSelection } from '@/components/scripts/hooks/useTemplateSelection';
import ScriptTemplateGrid from '@/components/scripts/ScriptTemplateGrid';
import TargetAudienceDialog from '@/components/scripts/TargetAudienceDialog';
import { scriptTemplates } from '@/data/scriptTemplates';
import { useAnalytics } from '@/hooks/useAnalytics';

const ScriptGenerator = () => {
  const { user, isPremium, refreshSession } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [directPremiumCheck, setDirectPremiumCheck] = useState<boolean | null>(null);
  const { track } = useAnalytics();

  const premiumVerification = usePremiumVerification();
  const templateSelection = useTemplateSelection(checkPremiumStatus);

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

  async function checkPremiumStatus(): Promise<boolean> {
    if (!user?.id) {
      toast.error('Wymagane jest zalogowanie', {
        description: 'Zaloguj się, aby kontynuować.',
      });
      return false;
    }
    
    try {
      const directCheck = await checkPremiumDirectly(user.id);
      if (directCheck) {
        console.log('[ScriptGenerator] Direct DB check confirms premium status');
        setDirectPremiumCheck(true);
        return true;
      }
      
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

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const attemptRefresh = async () => {
      if (user?.id) {
        console.log("Script generator - attempting session refresh");
        setIsRefreshing(true);
        try {
          await refreshSession();
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
  
  const handleDialogOpenChange = (open: boolean) => {
    console.log(`Dialog ${open ? 'opening' : 'closing'} - handling change`, {
      currentDialogState: templateSelection.targetAudienceDialogOpen,
      currentTemplateId: templateSelection.currentTemplateId
    });
    
    templateSelection.handleDialogOpenChange(open);
    
    if (!open) {
      track('script_dialog_closed', {
        templateId: templateSelection.currentTemplateId
      });
      
      if (user?.id) {
        console.log("Revalidating premium status after dialog close");
        checkPremiumStatus();
      }
    }
  };
  
  const handleTemplateSelect = (templateId: string) => {
    if (!user) {
      toast.error('Wymagane jest zalogowanie', {
        description: 'Zaloguj się, aby kontynuować.',
      });
      return;
    }
    
    track('template_selected', {
      templateId,
      userId: user.id,
      isPremium: premiumVerification.isPremium
    });
    
    templateSelection.handleTemplateSelect(templateId);
  };

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
