
import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePaymentHandler } from '@/hooks/usePaymentHandler';
import { BillingToggle } from '@/components/pricing/BillingToggle';
import { PricingCard } from '@/components/pricing/PricingCard';
import { PricingFAQ } from '@/components/pricing/PricingFAQ';
import { BillingCycle, getProPrice, getPricingLabel } from '@/components/pricing/pricing-utils';
import { DebugDialog } from '@/components/pricing/DebugDialog';
import { Button } from '@/components/ui/button';

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  
  const {
    isLoading,
    debugInfo,
    collectDebugInfo,
    clearPaymentFlags,
    handleSubscribe
  } = usePaymentHandler();

  // Show debug dialog
  const showDebugDialog = () => {
    collectDebugInfo();
    setIsDebugOpen(true);
  };

  // Handle manual reset
  const handleManualReset = () => {
    clearPaymentFlags();
    collectDebugInfo();
    setIsDebugOpen(false);
    window.location.reload();
  };

  // Handle subscription
  const onSubscribe = () => {
    handleSubscribe(billingCycle);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Wybierz plan idealny dla siebie
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Profesjonalne narzędzie do copywritingu, które pomoże Ci tworzyć
            skuteczne teksty reklamowe.
          </p>
          
          {/* Debug button */}
          <button 
            onClick={showDebugDialog}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600"
          >
            Debug
          </button>
        </motion.div>

        {/* Billing toggle */}
        <BillingToggle value={billingCycle} onChange={setBillingCycle} />

        {/* Pricing card centered with max width */}
        <motion.div 
          className="max-w-md mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Pro Plan */}
          <PricingCard 
            price={getProPrice(billingCycle)}
            pricingLabel={getPricingLabel()}
            isAnnual={billingCycle === 'annual'}
            isLoading={isLoading}
            onSubscribe={onSubscribe}
          />
        </motion.div>

        {/* FAQ Section */}
        <PricingFAQ />
      </div>
      
      {/* Debug Dialog */}
      <DebugDialog 
        isOpen={isDebugOpen} 
        onOpenChange={setIsDebugOpen} 
        debugInfo={debugInfo} 
        onManualReset={handleManualReset} 
      />
    </div>
  );
};

export default Pricing;
