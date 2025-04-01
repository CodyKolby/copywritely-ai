
import { useState, useEffect } from 'react';
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
  const { isPremium, user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [targetAudienceDialogOpen, setTargetAudienceDialogOpen] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string>('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
    setTargetAudienceDialogOpen(true);
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
            Generator Skryptów AI
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Twórz skrypty, które zwiększają sprzedaż i budują Twoją markę osobistą. Wybierz szablon i zacznij działać.
          </p>
        </motion.div>

        {!isPremium && (
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
          isPremium={isPremium}
        />
      </div>
    </div>
  );
};

export default ScriptGenerator;
