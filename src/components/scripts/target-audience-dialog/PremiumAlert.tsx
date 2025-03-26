
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';

interface PremiumAlertProps {
  onCancel: () => void;
}

const PremiumAlert = ({ onCancel }: PremiumAlertProps) => {
  return (
    <div className="py-4">
      <Alert variant="premium" className="mb-6">
        <ExclamationTriangleIcon className="h-5 w-5 text-white" />
        <AlertTitle className="text-white text-xl font-semibold">Premium feature</AlertTitle>
        <AlertDescription className="text-white">
          Target audience creation is only available for premium users. Upgrade your account to access this feature.
        </AlertDescription>
      </Alert>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-full border-2 font-medium"
        >
          Anuluj
        </Button>
        <Button 
          onClick={() => window.location.href = '/pricing'} 
          className="bg-copywrite-teal hover:bg-copywrite-teal-dark transition-colors rounded-full text-white font-medium"
        >
          View Pricing
        </Button>
      </div>
    </div>
  );
};

export default PremiumAlert;
