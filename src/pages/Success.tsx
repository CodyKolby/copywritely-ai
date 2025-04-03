
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/auth/AuthContext';
import { SuccessState } from '@/components/payment/SuccessState';
import { ErrorState } from '@/components/payment/ErrorState';
import { LoadingState } from '@/components/payment/LoadingState';
import { useSuccessPage } from './success/useSuccessPage';

const Success = () => {
  const location = useLocation();
  const { isPremium } = useAuth();
  
  // Extract session ID from URL
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');
  
  const {
    loading,
    error,
    verificationSuccess,
    waitTime,
    redirectTimer,
    handleManualRetry
  } = useSuccessPage({ sessionId });

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-xl shadow-lg text-center"
        >
          {isPremium ? (
            // CRITICAL: Show success immediately if isPremium is true in auth context
            <SuccessState 
              redirectTimer={redirectTimer}
            />
          ) : loading ? (
            <LoadingState 
              isWaitingForAuth={false}
              onManualRetry={handleManualRetry}
              waitTime={waitTime}
            />
          ) : error ? (
            <ErrorState 
              error={error} 
              onRetry={handleManualRetry}
            />
          ) : (
            <SuccessState 
              redirectTimer={redirectTimer}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Success;
