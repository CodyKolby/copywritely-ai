
import React from 'react';
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Clock } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import SubscriptionModalHeader from './SubscriptionModalHeader';

interface TrialStateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formatDate: (date: string) => string;
  expiryDate: string;
  daysRemaining: number;
}

const TrialState: React.FC<TrialStateProps> = ({ 
  open, 
  onOpenChange, 
  formatDate, 
  expiryDate, 
  daysRemaining 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-auto max-w-md rounded-xl p-6">
        <SubscriptionModalHeader 
          title="Twoja subskrypcja Premium"
          description="Posiadasz aktywny okres próbny"
        />
        
        <Card className="border-none shadow-none">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Okres próbny</h3>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="px-2 py-1 bg-blue-500">
                  Okres próbny
                </Badge>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 gap-2">
                <CalendarClock className="h-4 w-4" />
                <span>
                  Koniec okresu próbnego: {formatDate(expiryDate)}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {daysRemaining} {daysRemaining === 1 ? 'dzień' : 
                   daysRemaining < 5 ? 'dni' : 'dni'} do końca
                </span>
              </div>
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex justify-center">
              <Button 
                onClick={() => window.location.href = '/pricing'} 
                className="flex items-center gap-2 rounded-lg px-6" 
                variant="default"
              >
                Wykup pełną subskrypcję
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <DialogFooter className="flex justify-center pt-4">
          <Button onClick={() => onOpenChange(false)} className="rounded-lg">Zamknij</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrialState;
