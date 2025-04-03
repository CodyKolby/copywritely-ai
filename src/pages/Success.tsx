
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePaymentVerification } from '@/hooks/payment/usePaymentVerification';
import { SuccessState } from '@/components/payment/SuccessState';
import { ErrorState } from '@/components/payment/ErrorState';
import { LoadingState } from '@/components/payment/LoadingState';

const Success = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sessionId = searchParams.get('session_id');
  
  const {
    loading,
    error,
    verificationSuccess,
    waitingForAuth,
    handleRetryVerification
  } = usePaymentVerification(sessionId);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-xl shadow-lg text-center"
        >
          {loading ? (
            <LoadingState isWaitingForAuth={waitingForAuth} />
          ) : error ? (
            <ErrorState error={error} onRetry={handleRetryVerification} />
          ) : (
            <SuccessState />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Success;
