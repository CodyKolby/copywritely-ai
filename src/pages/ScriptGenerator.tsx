
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useAuth } from '@/contexts/auth/AuthContext';
import { checkAllPremiumStorages, updateAllPremiumStorages } from '@/contexts/auth/local-storage-utils';
import { forcePremiumStatusUpdate, checkPremiumStatus } from '@/contexts/auth/premium-utils';
import { supabase } from '@/integrations/supabase/client';

// Import components
import ScriptTemplateGrid from '@/components/scripts/ScriptTemplateGrid';
import TargetAudienceDialog from '@/components/scripts/TargetAudienceDialog';

// Types and templates
import { scriptTemplates } from '@/data/scriptTemplates';

const ScriptGenerator = () => {
  const { isPremium, user, checkPremiumStatus } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [targetAudienceDialogOpen, setTargetAudienceDialogOpen] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string>('');
  const [localPremiumStatus, setLocalPremiumStatus] = useState<boolean | null>(null);
  const [isCheckingPremium, setIsCheckingPremium] = useState(false);
  const premiumCheckedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  // On mount, scroll to top and perform premium status check
  useEffect(() => {
    window.scrollTo(0, 0);
    
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Verify premium status when component mounts or user changes
  useEffect(() => {
    // Check storage for premium status immediately
    const storagePremium = checkAllPremiumStorages();
    if (storagePremium) {
      console.log('[SCRIPT-GENERATOR] Premium status found in storage');
      setLocalPremiumStatus(true);
    }
    
    // If user exists and premium status not checked yet, verify with server
    if (user?.id && !premiumCheckedRef.current) {
      setIsCheckingPremium(true);
      premiumCheckedRef.current = true;
      
      // Extra verification for premium status - first check profiles table directly
      const verifyWithDatabase = async () => {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('is_premium, subscription_status, subscription_expiry')
            .eq('id', user.id)
            .single();
            
          if (!error && profile?.is_premium) {
            console.log('[SCRIPT-GENERATOR] Found premium status in database');
            if (isMountedRef.current) {
              setLocalPremiumStatus(true);
              updateAllPremiumStorages(true);
            }
            setIsCheckingPremium(false);
            return;
          }
          
          // If database check didn't confirm premium, use the check function
          const status = await checkPremiumStatus(user.id, false);
          console.log('[SCRIPT-GENERATOR] Premium status after check:', status);
          
          if (isMountedRef.current) {
            setLocalPremiumStatus(status);
            if (status) {
              updateAllPremiumStorages(true);
            }
            setIsCheckingPremium(false);
          }
        } catch (e) {
          console.error('[SCRIPT-GENERATOR] Error checking premium status:', e);
          if (isMountedRef.current) {
            setIsCheckingPremium(false);
          }
        }
      };
      
      verifyWithDatabase();
    }
  }, [user, checkPremiumStatus]);

  // Sync localPremiumStatus with isPremium when it changes
  useEffect(() => {
    if (isPremium) {
      console.log('[SCRIPT-GENERATOR] Setting local premium from context');
      setLocalPremiumStatus(true);
      updateAllPremiumStorages(true);
    }
  }, [isPremium]);

  const validatePremiumStatus = async () => {
    if (!user?.id) return false;
    
    // First check storage immediately
    const storagePremium = checkAllPremiumStorages();
    if (storagePremium) {
      return true;
    }
    
    // Then check with database directly for fastest response
    setIsCheckingPremium(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single();
        
      if (!error && profile?.is_premium) {
        console.log('[SCRIPT-GENERATOR] Premium confirmed from database');
        updateAllPremiumStorages(true);
        setIsCheckingPremium(false);
        return true;
      }
      
      // If not found in database, check with server function
      const serverPremium = await checkPremiumStatus(user.id, false);
      if (serverPremium) {
        updateAllPremiumStorages(true);
      }
      setIsCheckingPremium(false);
      return serverPremium;
    } catch (e) {
      console.error('[SCRIPT-GENERATOR] Error checking premium:', e);
      setIsCheckingPremium(false);
      
      // Fallback to context state if available
      return isPremium || localPremiumStatus || false;
    }
  };

  const handleTemplateSelect = async (templateId: string) => {
    // Check if template is "landing" which is marked as coming soon
    const selectedTemplate = scriptTemplates.find(template => template.id === templateId);
    
    if (selectedTemplate?.comingSoon) {
      toast.info('Wkrótce dostępne', {
        description: 'Ta funkcjonalność będzie dostępna w przyszłych aktualizacjach.',
        dismissible: true
      });
      return;
    }
    
    setCurrentTemplateId(templateId);
    setSelectedTemplate(templateId);
    
    // Thoroughly check premium status before proceeding
    setIsCheckingPremium(true);
    const hasPremium = await validatePremiumStatus();
    setIsCheckingPremium(false);
    
    if (!hasPremium) {
      toast.error('Ta funkcja wymaga konta Premium', {
        description: 'Wykup subskrypcję, aby uzyskać dostęp do tej funkcji.',
        dismissible: true
      });
      
      // One final verification attempt
      if (user?.id) {
        setIsCheckingPremium(true);
        
        // Force update premium status
        const forceResult = await forcePremiumStatusUpdate(user.id);
        setIsCheckingPremium(false);
        
        if (forceResult) {
          setLocalPremiumStatus(true);
          setTargetAudienceDialogOpen(true);
          return;
        }
        
        // If force update fails, try normal check one more time
        setIsCheckingPremium(true);
        const finalCheck = await checkPremiumStatus(user.id, false);
        setIsCheckingPremium(false);
        
        if (finalCheck) {
          setLocalPremiumStatus(true);
          setTargetAudienceDialogOpen(true);
        }
      }
      return;
    }
    
    setTargetAudienceDialogOpen(true);
  };

  // Handle dialog closed - recheck premium status
  const handleDialogOpenChange = (open: boolean) => {
    setTargetAudienceDialogOpen(open);
    if (!open && user?.id) {
      // Revalidate premium after dialog closes
      validatePremiumStatus();
    }
  };

  // Determine if we should show the premium feature alert
  // Only show it if BOTH isPremium and localPremiumStatus are false and we're not checking
  const shouldShowPremiumAlert = isPremium === false && localPremiumStatus === false && !isCheckingPremium;

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
              <AlertTitle className="text-white text-xl font-semibold">Premium feature</AlertTitle>
              <AlertDescription className="text-white">
                Script generation is a premium feature. You'll be able to preview the templates, but generating scripts requires a premium account.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <ScriptTemplateGrid 
          templates={scriptTemplates}
          onSelectTemplate={handleTemplateSelect}
        />

        {!isCheckingPremium && (
          <TargetAudienceDialog
            open={targetAudienceDialogOpen}
            onOpenChange={handleDialogOpenChange}
            templateId={currentTemplateId}
            userId={user?.id || ''}
            isPremium={isPremium || !!localPremiumStatus}
          />
        )}
      </div>
    </div>
  );
};

export default ScriptGenerator;
