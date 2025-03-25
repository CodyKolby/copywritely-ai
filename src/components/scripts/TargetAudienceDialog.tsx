
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import TargetAudienceForm from './TargetAudienceForm';
import { toast } from 'sonner';

interface TargetAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  userId: string;
  isPremium: boolean;
}

const TargetAudienceDialog = ({
  open,
  onOpenChange,
  templateId,
  userId,
  isPremium,
}: TargetAudienceDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleFormSubmit = async (data: any) => {
    if (!isPremium) {
      toast.error('Nie posiadasz konta premium', {
        description: 'Ta funkcjonalność jest dostępna tylko dla użytkowników premium.'
      });
      onOpenChange(false);
      return;
    }

    setIsLoading(true);
    try {
      // Here you would typically save the form data to a database
      console.log('Form data submitted:', data);
      
      // Mock API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Zapisano dane grupy docelowej', {
        description: 'Twoje dane zostały zapisane i zostaną wykorzystane do generowania skryptu.'
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Błąd podczas zapisywania danych', {
        description: 'Spróbuj ponownie później lub skontaktuj się z obsługą klienta.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Wybierz grupę docelową dla której chcesz stworzyć skrypt
          </DialogTitle>
        </DialogHeader>
        
        <TargetAudienceForm 
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};

export default TargetAudienceDialog;
