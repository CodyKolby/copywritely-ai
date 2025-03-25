
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface TargetAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  userId: string;
  isPremium: boolean;
}

export interface TargetAudience {
  id: string;
  name: string;
  created_at: string;
  user_id: string;
}

const TargetAudienceDialog = ({ 
  open, 
  onOpenChange, 
  templateId, 
  userId,
  isPremium 
}: TargetAudienceDialogProps) => {
  const [activeTab, setActiveTab] = useState<string>('existing');
  const [savedAudiences, setSavedAudiences] = useState<TargetAudience[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open && userId) {
      loadSavedAudiences();
    }
  }, [open, userId]);

  const loadSavedAudiences = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from the database
      // For now, we'll simulate with an empty array since we don't have the table yet
      setSavedAudiences([]);
    } catch (error) {
      console.error('Error loading saved audiences:', error);
      toast.error('Failed to load saved audiences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!isPremium) {
      toast.error('Nie posiadasz konta premium', {
        description: 'Ta funkcjonalność jest dostępna tylko dla użytkowników premium.'
      });
      onOpenChange(false);
      return;
    }
    
    toast.info('Ta funkcja jest w trakcie implementacji', {
      description: 'Ta funkcjonalność będzie dostępna wkrótce.'
    });
    
    // Close the dialog
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Wybierz grupę docelową dla skryptu
          </DialogTitle>
          <DialogDescription>
            Grupa docelowa pomoże AI stworzyć bardziej spersonalizowany tekst do Twoich potrzeb.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="existing" value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="existing">Użyj istniejącą</TabsTrigger>
            <TabsTrigger value="new">Stwórz nową</TabsTrigger>
          </TabsList>
          
          <TabsContent value="existing" className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-copywrite-teal" />
              </div>
            ) : savedAudiences.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {savedAudiences.map((audience) => (
                  <div 
                    key={audience.id}
                    className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    {audience.name}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <p>Nie masz jeszcze zapisanych grup docelowych.</p>
                <p className="mt-2">Przejdź do zakładki "Stwórz nową" aby utworzyć swoją pierwszą grupę.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="new" className="mt-4">
            <div className="text-center py-6 text-gray-500">
              <p>Ta funkcjonalność będzie dostępna wkrótce.</p>
              <p className="mt-2">Po implementacji, będziesz mógł utworzyć nową grupę docelową.</p>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-6">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Anuluj
          </Button>
          <Button 
            onClick={handleContinue}
            className="bg-copywrite-teal hover:bg-copywrite-teal-dark"
          >
            Kontynuuj
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TargetAudienceDialog;
