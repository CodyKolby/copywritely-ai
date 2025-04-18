
import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { analyticsService } from '@/lib/analytics/analytics-service';
import { useAuth } from '@/contexts/auth/AuthContext';

interface SuccessStateProps {
  redirectTimer: number;
}

export const SuccessState: React.FC<SuccessStateProps> = ({ redirectTimer }) => {
  const { profile } = useAuth();
  
  useEffect(() => {
    // Check if user is in trial mode and track the event if applicable
    if (profile?.subscription_status === 'trialing') {
      console.log('Tracking trial started event from SuccessState');
      analyticsService.trackTrialStarted();
    }
  }, [profile]);
  
  // Determine message based on subscription status
  const getMessage = () => {
    if (profile?.subscription_status === 'scheduled_cancel') {
      return 'Twoje konto jest aktywne, ale zostanie zamknięte na koniec okresu rozliczeniowego.';
    }
    return 'Twoje konto zostało zaktualizowane do wersji Premium.';
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 text-green-500">
        <CheckCircle size={80} />
      </div>
      <h2 className="text-2xl font-bold mb-4">Płatność zakończona pomyślnie!</h2>
      <p className="text-gray-600 mb-4 text-center">
        {getMessage()}
        {redirectTimer > 0 && <span> Nastąpi przekierowanie...</span>}
      </p>
      <div className="flex gap-4 mt-4">
        <Button asChild>
          <Link to="/projekty">Przejdź do projektów</Link>
        </Button>
      </div>
    </div>
  );
};
