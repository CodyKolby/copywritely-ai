import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useAuth } from '@/contexts/auth/AuthContext';

// Import reusable components
import BriefTemplateGrid from '@/components/briefs/BriefTemplateGrid';
import GenerationTypeDialog, { FormValues } from '@/components/briefs/GenerationTypeDialog';
import AdObjectiveDialog, { AdObjectiveFormValues, adObjectives } from '@/components/briefs/AdObjectiveDialog';
import GeneratedBriefDisplay from '@/components/briefs/GeneratedBriefDisplay';
import NextStepsCard from '@/components/briefs/NextStepsCard';

// Import data
import { sampleBriefTemplates, sampleBriefs } from '@/data/briefTemplates';
import { Brief } from '@/components/BriefCard';

const BriefGenerator = () => {
  const { isPremium } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generatedBrief, setGeneratedBrief] = useState<Brief | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adObjectiveDialogOpen, setAdObjectiveDialogOpen] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string>('');
  const [selectedGenerationType, setSelectedGenerationType] = useState<'ai' | 'guided'>('ai');
  const [guidanceText, setGuidanceText] = useState<string>('');
  const [selectedAdObjective, setSelectedAdObjective] = useState<string>('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const openGenerationDialog = (templateId: string) => {
    setCurrentTemplateId(templateId);
    setDialogOpen(true);
  };

  const handleGenerationTypeSubmit = (values: FormValues) => {
    if (!isPremium) {
      setDialogOpen(false);
      toast.error('Nie posiadasz konta premium', {
        description: 'Ta funkcjonalność jest dostępna tylko dla użytkowników premium.'
      });
      return;
    }
    
    setSelectedGenerationType(values.generationType);
    setGuidanceText(values.guidanceText || '');
    setDialogOpen(false);
    
    if (currentTemplateId === 'ad') {
      setAdObjectiveDialogOpen(true);
    } else {
      generateBrief(currentTemplateId, values.generationType, values.guidanceText || '');
    }
  };

  const handleAdObjectiveSubmit = (values: AdObjectiveFormValues) => {
    if (!isPremium) {
      setAdObjectiveDialogOpen(false);
      toast.error('Nie posiadasz konta premium', {
        description: 'Ta funkcjonalność jest dostępna tylko dla użytkowników premium.'
      });
      return;
    }
    
    setSelectedAdObjective(values.objective);
    setAdObjectiveDialogOpen(false);
    
    generateBriefWithObjective(currentTemplateId, selectedGenerationType, guidanceText, values.objective);
  };

  const generateBrief = (templateId: string, generationType: 'ai' | 'guided', guidanceText: string) => {
    setIsLoading(true);
    setSelectedTemplate(templateId);
    setGeneratedBrief(null);
    
    console.log('Generation type:', generationType);
    if (generationType === 'guided' && guidanceText) {
      console.log('User guidance:', guidanceText);
    }
    
    setTimeout(() => {
      setGeneratedBrief(sampleBriefs[templateId]);
      setIsLoading(false);
      toast.success('Brief generated successfully!');
    }, 1500);
  };

  const generateBriefWithObjective = (templateId: string, generationType: 'ai' | 'guided', guidance: string, objective: string) => {
    setIsLoading(true);
    setSelectedTemplate(templateId);
    setGeneratedBrief(null);
    
    console.log('Generation type:', generationType);
    console.log('Ad objective:', objective);
    if (generationType === 'guided' && guidance) {
      console.log('User guidance:', guidance);
    }
    
    setTimeout(() => {
      const objectiveTitle = adObjectives.find(obj => obj.id === objective)?.title || objective;
      
      const modifiedBrief = {
        ...sampleBriefs[templateId],
        objective: objectiveTitle,
      };
      
      setGeneratedBrief(modifiedBrief);
      setIsLoading(false);
      toast.success('Brief generated successfully!');
    }, 1500);
  };

  const resetBrief = () => {
    setSelectedTemplate(null);
    setGeneratedBrief(null);
    setSelectedAdObjective('');
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            AI Brief Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Generate creative briefs for your copywriting practice. Select a template to get started.
          </p>
        </motion.div>

        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-4 w-4" />
              <AlertTitle>Premium feature</AlertTitle>
              <AlertDescription>
                Brief generation is a premium feature. You'll be able to preview the brief templates, but generating briefs requires a premium account.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

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
          />
        )}

        <NextStepsCard />

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
