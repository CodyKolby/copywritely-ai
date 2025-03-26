
import { motion } from 'framer-motion';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

const PremiumFeatureAlert = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <Alert variant="premium" className="rounded-none">
        <ExclamationTriangleIcon className="h-5 w-5 text-white" />
        <AlertTitle className="text-white text-xl font-semibold">Premium feature</AlertTitle>
        <AlertDescription className="text-white">
          Brief generation is a premium feature. You'll be able to preview the brief templates, but generating briefs requires a premium account.
        </AlertDescription>
      </Alert>
    </motion.div>
  );
};

export default PremiumFeatureAlert;
