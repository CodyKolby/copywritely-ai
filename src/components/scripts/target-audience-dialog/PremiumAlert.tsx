
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
      <Alert variant="destructive" className="mb-4 bg-red-600 rounded-md">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle>Premium feature</AlertTitle>
        <AlertDescription>
          Target audience creation is only available for premium users. Upgrade your account to access this feature.
        </AlertDescription>
      </Alert>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-full text-white"
        >
          Anuluj
        </Button>
        <Button 
          onClick={() => window.location.href = '/pricing'} 
          className="bg-copywrite-teal hover:bg-copywrite-teal-dark transition-colors rounded-full text-white"
        >
          View Pricing
        </Button>
      </div>
    </div>
  );
};

export default PremiumAlert;
