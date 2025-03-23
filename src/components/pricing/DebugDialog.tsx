
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DebugInfo } from "@/hooks/usePaymentHandler";

interface DebugDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  debugInfo: DebugInfo;
  onManualReset: () => void;
}

export const DebugDialog = ({
  isOpen,
  onOpenChange,
  debugInfo,
  onManualReset,
}: DebugDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Informacje diagnostyczne</DialogTitle>
          <DialogDescription>
            Informacje o statusie płatności i sesji
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 text-sm">
          <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto">
            {Object.entries(debugInfo).map(([key, value]) => (
              <div key={key} className="mb-2">
                <span className="font-medium">{key}:</span> {value}
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Zamknij
            </Button>
            <Button onClick={onManualReset} className="bg-red-500 hover:bg-red-600">
              Wyczyść flagi i odśwież
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
