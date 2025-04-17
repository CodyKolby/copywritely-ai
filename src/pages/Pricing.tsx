
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { usePaymentHandler } from '@/hooks/usePaymentHandler';
import { BillingToggle } from '@/components/pricing/BillingToggle';
import { PricingCard } from '@/components/pricing/PricingCard';
import { BillingCycle, getProPrice, getPricingLabel } from '@/components/pricing/pricing-utils';
import { DebugDialog } from '@/components/pricing/DebugDialog';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

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
    <div className="pt-24 pb-20 px-4">
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
            Nowoczesna platforma do tworzenia skryptów, które realnie zwiększają sprzedaż i rozwijają Twoją markę.
          </p>
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

        {/* Contact us button */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-center mt-10"
        >
          <p className="text-gray-600 mb-3">Masz pytania dotyczące naszych planów?</p>
          <Link to="/contact">
            <Button variant="outline" className="gap-2">
              <Mail size={16} />
              Skontaktuj się z nami
            </Button>
          </Link>
        </motion.div>
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
