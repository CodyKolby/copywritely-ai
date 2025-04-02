
import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';

// Import reusable components
import BriefTemplateGrid from '@/components/briefs/BriefTemplateGrid';
import GenerationTypeDialog, { FormValues } from '@/components/briefs/GenerationTypeDialog';
import AdObjectiveDialog, { AdObjectiveFormValues } from '@/components/briefs/AdObjectiveDialog';
import GeneratedBriefDisplay from '@/components/briefs/GeneratedBriefDisplay';
import NextStepsCard from '@/components/briefs/NextStepsCard';
import BriefGeneratorHeader from '@/components/briefs/BriefGeneratorHeader';
import PremiumFeatureAlert from '@/components/briefs/PremiumFeatureAlert';

// Import data
import { sampleBriefTemplates } from '@/data/briefTemplates';
import { useBriefGenerator } from '@/components/briefs/useBriefGenerator';

const BriefGenerator = () => {
  const { isPremium, profile } = useAuth();
  
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
    handleViewProject
  } = useBriefGenerator(isPremium);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <BriefGeneratorHeader />
        
        {!isPremium && <PremiumFeatureAlert />}
        
        {!selectedTemplate ? (
          <BriefTemplateGrid 
            templates={sampleBriefTemplates}
            onSelectTemplate={openGenerationDialog}
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

        <NextStepsCard isPremium={isPremium} />
        
        <GenerationTypeDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleGenerationTypeSubmit}
          isPremium={isPremium}
        />
        
        <AdObjectiveDialog
          open={adObjectiveDialogOpen}
          onOpenChange={setAdObjectiveDialogOpen}
          onSubmit={handleAdObjectiveSubmit}
          isPremium={isPremium}
        />
      </div>
    </div>
  );
};

export default BriefGenerator;
