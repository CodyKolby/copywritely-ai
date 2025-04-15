
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useAuth } from '@/contexts/auth/AuthContext';

// Import hooks
import { usePremiumVerification } from '@/hooks/usePremiumVerification';
import { useTemplateSelection } from '@/components/scripts/hooks/useTemplateSelection';

// Import components
import ScriptTemplateGrid from '@/components/scripts/ScriptTemplateGrid';
import TargetAudienceDialog from '@/components/scripts/TargetAudienceDialog';

// Types and templates
import { scriptTemplates } from '@/data/scriptTemplates';

const ScriptGenerator = () => {
  const { user } = useAuth();
  
  // Use custom hooks
  const premiumVerification = usePremiumVerification();
  const templateSelection = useTemplateSelection(premiumVerification.validatePremiumStatus);

  // On mount, scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  // Ensure targetAudienceDialogOpen is properly set 
  useEffect(() => {
    console.log("Script generator page loaded", {
      currentTemplateId: templateSelection.currentTemplateId,
      dialogOpen: templateSelection.targetAudienceDialogOpen
    });
  }, [templateSelection.currentTemplateId, templateSelection.targetAudienceDialogOpen]);
  
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
        premiumVerification.validatePremiumStatus();
      }
    }
  };
  
  // Create a handler for template selection that logs details
  const handleTemplateSelect = (templateId: string) => {
    console.log(`Template ${templateId} selected, current state:`, {
      isPremium: premiumVerification.isPremium,
      isCheckingPremium: premiumVerification.isCheckingPremium
    });
    templateSelection.handleTemplateSelect(templateId);
  };

  // Determine if we should show the premium feature alert
  const shouldShowPremiumAlert = !premiumVerification.isPremium && !premiumVerification.isCheckingPremium;

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

        {!premiumVerification.isCheckingPremium && (
          <TargetAudienceDialog
            key={`dialog-${templateSelection.currentTemplateId || 'default'}`}
            open={templateSelection.targetAudienceDialogOpen}
            onOpenChange={handleDialogOpenChange}
            templateId={templateSelection.currentTemplateId}
            userId={user?.id || ''}
            isPremium={premiumVerification.isPremium}
          />
        )}
      </div>
    </div>
  );
};

export default ScriptGenerator;
