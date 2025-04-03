
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useAuth } from '@/contexts/auth/AuthContext';

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
  const premiumCheckedRef = useRef<boolean>(false);

  // On mount, scroll to top and perform premium status check
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Check if localStorage indicates premium
    const premiumBackup = localStorage.getItem('premium_backup') === 'true';
    if (premiumBackup) {
      setLocalPremiumStatus(true);
    }
    
    // If user exists, double-check premium status once on mount
    if (user?.id && !premiumCheckedRef.current) {
      premiumCheckedRef.current = true;
      checkPremiumStatus(user.id, false).then(status => {
        setLocalPremiumStatus(status);
      });
    }
  }, [user, checkPremiumStatus]);

  // Sync localPremiumStatus with isPremium when it changes
  useEffect(() => {
    setLocalPremiumStatus(isPremium);
  }, [isPremium]);

  const handleTemplateSelect = (templateId: string) => {
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
    
    // If either isPremium or localPremiumStatus is true, allow access
    const hasPremium = isPremium || localPremiumStatus;
    
    if (!hasPremium) {
      toast.error('Ta funkcja wymaga konta Premium', {
        description: 'Wykup subskrypcję, aby uzyskać dostęp do tej funkcji.',
        dismissible: true
      });
      
      // Verify premium status one more time in background
      if (user?.id) {
        checkPremiumStatus(user.id, false).then(status => {
          if (status) {
            setLocalPremiumStatus(true);
            setTargetAudienceDialogOpen(true);
          }
        });
      }
      return;
    }
    
    setTargetAudienceDialogOpen(true);
  };

  // Determine if we should show the premium feature alert
  // Only show it if BOTH isPremium and localPremiumStatus are false
  const shouldShowPremiumAlert = isPremium === false && localPremiumStatus === false;

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

        <TargetAudienceDialog
          open={targetAudienceDialogOpen}
          onOpenChange={setTargetAudienceDialogOpen}
          templateId={currentTemplateId}
          userId={user?.id || ''}
          isPremium={isPremium || !!localPremiumStatus}
        />
      </div>
    </div>
  );
};

export default ScriptGenerator;
