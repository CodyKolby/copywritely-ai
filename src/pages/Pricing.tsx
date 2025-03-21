import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
  
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Calculate pro price based on billing cycle (50% off for annual)
  const getProPrice = () => {
    return billingCycle === 'annual' ? '39.99' : '79.99';
  };
  
  // Fixed: Now correctly returns "miesięcznie" for both billing cycles
  const getPricingLabel = () => {
    return 'miesięcznie';
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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
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
        </motion.div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-8">
          <Tabs
            defaultValue="annual"
            value={billingCycle}
            onValueChange={(value) => setBillingCycle(value as 'annual' | 'monthly')}
            className="bg-gray-100 p-1 rounded-full"
          >
            <TabsList className="grid grid-cols-2 w-[280px]">
              <TabsTrigger value="monthly" className="rounded-full">
                Monthly
              </TabsTrigger>
              <TabsTrigger value="annual" className="rounded-full">
                Annual <span className="ml-1 text-green-600 text-xs font-medium">(Save 50%)</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Pricing card centered with max width */}
        <motion.div 
          className="max-w-md mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Pro Plan */}
          <motion.div variants={itemVariants}>
            <Card className="relative border-copywrite-teal/30 shadow-lg overflow-hidden">
              {/* Free trial badge */}
              <div className="absolute top-4 right-4">
                <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1 px-3 py-1">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="font-medium">3 dni za darmo</span>
                </Badge>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-3xl font-bold">Pro</h2>
                </div>
                <p className="text-gray-600 mb-6">
                  Pełen dostęp do zaawansowanych funkcji copywritingu.
                </p>
                <div className="flex items-baseline mb-2">
                  <span className="text-5xl font-bold">{getProPrice()}</span>
                  <span className="text-xl ml-1">PLN</span>
                  <span className="text-gray-500 ml-2">/ {getPricingLabel()}</span>
                  
                  {/* Billing cycle badge */}
                  {billingCycle === 'annual' && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 ml-3">
                      Rozliczenie roczne
                    </Badge>
                  )}
                </div>
                
                {billingCycle === 'annual' && (
                  <div className="mb-4">
                    <span className="text-gray-400 line-through">79.99 PLN</span>
                  </div>
                )}
                
                {/* Free trial notice */}
                <div className="mb-6 bg-green-50 p-3 rounded-lg border border-green-100">
                  <p className="text-green-700 text-sm flex items-center">
                    <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                    Rozpocznij od 3-dniowego darmowego okresu próbnego. Anuluj w dowolnym momencie.
                  </p>
                </div>
                
                <Button 
                  className="w-full mb-6 bg-copywrite-teal hover:bg-copywrite-teal-dark h-12 text-base"
                >
                  Rozpocznij darmowy okres próbny
                </Button>
              </div>
              
              <CardContent className="border-t border-gray-100 bg-gray-50 p-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Nielimitowana liczba briefów i analiz</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Gotowe briefy generowane przez AI</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Tworzenie spersonalizowanych briefów pod swoją grupę docelową</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Zaawansowana analiza tekstów przez AI</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Zapis projektów w aplikacji</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-20 text-center"
        >
          <h2 className="text-3xl font-bold mb-8">Masz pytania?</h2>
          <div className="flex justify-center">
            <Button variant="outline" className="border-copywrite-teal text-copywrite-teal">
              Skontaktuj się z nami
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Pricing;
