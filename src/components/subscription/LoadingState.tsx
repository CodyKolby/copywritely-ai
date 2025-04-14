
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface LoadingStateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoadingState: React.FC<LoadingStateProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-semibold">Ładowanie danych subskrypcji...</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoadingState;
