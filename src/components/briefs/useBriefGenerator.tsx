
import { useState } from 'react';
import { toast } from 'sonner';
import { Brief } from '@/components/BriefCard';
import { sampleBriefs } from '@/data/briefTemplates';
import { adObjectives } from '@/components/briefs/AdObjectiveDialog';

type GenerationType = 'ai' | 'guided';

export const useBriefGenerator = (isPremium: boolean) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generatedBrief, setGeneratedBrief] = useState<Brief | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adObjectiveDialogOpen, setAdObjectiveDialogOpen] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string>('');
  const [selectedGenerationType, setSelectedGenerationType] = useState<GenerationType>('ai');
  const [guidanceText, setGuidanceText] = useState<string>('');
  const [selectedAdObjective, setSelectedAdObjective] = useState<string>('');

  const openGenerationDialog = (templateId: string) => {
    if (templateId === 'landing') {
      toast.info('Wkrótce dostępne', {
        description: 'Ta funkcjonalność będzie dostępna w przyszłych aktualizacjach.',
        dismissible: true
      });
      return;
    }
    
    setCurrentTemplateId(templateId);
    setDialogOpen(true);
  };

  const handleGenerationTypeSubmit = (values: { generationType: GenerationType; guidanceText?: string }) => {
    if (!isPremium) {
      setDialogOpen(false);
      toast.error('Nie posiadasz konta premium', {
        description: 'Ta funkcjonalność jest dostępna tylko dla użytkowników premium.',
        dismissible: true
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

  const handleAdObjectiveSubmit = (values: { objective: string }) => {
    if (!isPremium) {
      setAdObjectiveDialogOpen(false);
      toast.error('Nie posiadasz konta premium', {
        description: 'Ta funkcjonalność jest dostępna tylko dla użytkowników premium.',
        dismissible: true
      });
      return;
    }
    
    setSelectedAdObjective(values.objective);
    setAdObjectiveDialogOpen(false);
    
    generateBriefWithObjective(currentTemplateId, selectedGenerationType, guidanceText, values.objective);
  };

  const generateBrief = (templateId: string, generationType: GenerationType, guidanceText: string) => {
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
      toast.success('Brief generated successfully!', {
        dismissible: true
      });
    }, 1500);
  };

  const generateBriefWithObjective = (templateId: string, generationType: GenerationType, guidance: string, objective: string) => {
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
      toast.success('Brief generated successfully!', {
        dismissible: true
      });
    }, 1500);
  };

  const resetBrief = () => {
    setSelectedTemplate(null);
    setGeneratedBrief(null);
    setSelectedAdObjective('');
  };

  return {
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
    resetBrief
  };
};
