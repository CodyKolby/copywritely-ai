
import { useState } from 'react';
import { toast } from 'sonner';
import { scriptTemplates } from '@/data/scriptTemplates';

export const useTemplateSelection = (validatePremiumStatus: () => Promise<boolean>) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [targetAudienceDialogOpen, setTargetAudienceDialogOpen] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string>('');

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
    const hasPremium = await validatePremiumStatus();
    
    if (!hasPremium) {
      toast.error('Ta funkcja wymaga konta Premium', {
        description: 'Wykup subskrypcję, aby uzyskać dostęp do tej funkcji.',
        dismissible: true
      });
      return;
    }
    
    setTargetAudienceDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setTargetAudienceDialogOpen(open);
  };

  return {
    selectedTemplate,
    targetAudienceDialogOpen,
    currentTemplateId,
    handleTemplateSelect,
    handleDialogOpenChange
  };
};
