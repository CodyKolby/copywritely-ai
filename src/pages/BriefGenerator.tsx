
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/auth/AuthContext';
import { checkAllPremiumStorages, updateAllPremiumStorages } from '@/contexts/auth/local-storage-utils';
import { forcePremiumStatusUpdate } from '@/contexts/auth/premium-utils';

// Import components
import BriefTemplateGrid from '@/components/briefs/BriefTemplateGrid';
import GenerationTypeDialog from '@/components/briefs/GenerationTypeDialog';
import AdObjectiveDialog from '@/components/briefs/AdObjectiveDialog';
import GeneratedBriefDisplay from '@/components/briefs/GeneratedBriefDisplay';
import BriefGeneratorHeader from '@/components/briefs/BriefGeneratorHeader';
import PremiumFeatureAlert from '@/components/briefs/PremiumFeatureAlert';
import { useBriefGenerator } from '@/components/briefs/useBriefGenerator';

// Import templates data
import { briefTemplates } from '@/data/briefTemplates';

const BriefGenerator = () => {
  const { isPremium, user, checkPremiumStatus } = useAuth();
  const [localPremiumStatus, setLocalPremiumStatus] = useState<boolean | null>(null);
  const [isCheckingPremium, setIsCheckingPremium] = useState(false);
  const premiumCheckedRef = useRef<boolean>(false);

  // On mount, scroll to top and check premium
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Check storage for premium status immediately
    const storagePremium = checkAllPremiumStorages();
    if (storagePremium) {
      console.log('[BRIEF-GENERATOR] Premium status found in storage');
      setLocalPremiumStatus(true);
    }
    
    // If user exists and premium not checked yet, verify with server
    if (user?.id && !premiumCheckedRef.current) {
      setIsCheckingPremium(true);
      premiumCheckedRef.current = true;
      
      checkPremiumStatus(user.id, false)
        .then(status => {
          console.log('[BRIEF-GENERATOR] Premium status after check:', status);
          setLocalPremiumStatus(status);
          if (status) {
            updateAllPremiumStorages(true);
          }
        })
        .finally(() => {
          setIsCheckingPremium(false);
        });
    }
  }, [user, checkPremiumStatus]);

  // Sync localPremiumStatus with isPremium when it changes
  useEffect(() => {
    if (isPremium) {
      console.log('[BRIEF-GENERATOR] Setting local premium from context');
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
    
    // Then check with server if needed
    setIsCheckingPremium(true);
    try {
      const serverPremium = await checkPremiumStatus(user.id, false);
      if (serverPremium) {
        updateAllPremiumStorages(true);
      }
      return serverPremium;
    } catch (e) {
      console.error('[BRIEF-GENERATOR] Error checking premium:', e);
      return isPremium || localPremiumStatus || false;
    } finally {
      setIsCheckingPremium(false);
    }
  };

  // Calculate effective premium status
  const effectivePremiumStatus = isPremium || !!localPremiumStatus;
  
  // Use the brief generator hook with the effective premium status
  const {
    selectedTemplate,
    generatedBrief,
    isLoading,
    dialogOpen,
    setDialogOpen,
    adObjectiveDialogOpen,
    setAdObjectiveDialogOpen,
    openGenerationDialog,
    handleGenerationTypeSubmit,
    handleAdObjectiveSubmit,
    resetBrief,
    projectSaved,
    projectId,
    handleViewProject,
  } = useBriefGenerator(effectivePremiumStatus);

  // Enhanced template select handler that checks premium status
  const handleTemplateSelect = async (templateId: string) => {
    // Thoroughly check premium status before proceeding
    const hasPremium = await validatePremiumStatus();
    
    if (!hasPremium) {
      // Even if premium validation fails, try one final verification attempt
      if (user?.id) {
        // Force update premium status
        const forceResult = await forcePremiumStatusUpdate(user.id);
        if (!forceResult) {
          // If force update fails, try normal check one more time
          const finalCheck = await checkPremiumStatus(user.id, false);
          if (!finalCheck) {
            return openGenerationDialog(templateId);
          }
        }
        updateAllPremiumStorages(true);
        setLocalPremiumStatus(true);
      }
    }
    
    // Proceed with opening dialog
    openGenerationDialog(templateId);
  };

  // Determine if we should show the premium feature alert
  // Only show it if we're not in a premium state and we're not checking
  const shouldShowPremiumAlert = !effectivePremiumStatus && !isCheckingPremium;

  return (
    <div className="pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <BriefGeneratorHeader />

        {shouldShowPremiumAlert && !generatedBrief && <PremiumFeatureAlert />}

        {!generatedBrief ? (
          <BriefTemplateGrid 
            templates={briefTemplates} 
            onSelectTemplate={handleTemplateSelect} 
          />
        ) : (
          <GeneratedBriefDisplay 
            isLoading={isLoading}
            generatedBrief={generatedBrief} 
            onResetBrief={resetBrief}
            projectSaved={projectSaved}
            projectId={projectId}
            onViewProject={handleViewProject}
          />
        )}

        <GenerationTypeDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen}
          onSubmit={handleGenerationTypeSubmit}
          isPremium={effectivePremiumStatus}
        />

        <AdObjectiveDialog
          open={adObjectiveDialogOpen}
          onOpenChange={setAdObjectiveDialogOpen}
          onSubmit={handleAdObjectiveSubmit}
        />
      </div>
    </div>
  );
};

export default BriefGenerator;
