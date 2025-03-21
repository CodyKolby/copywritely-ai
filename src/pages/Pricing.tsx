
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Check } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
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
    return billingCycle === 'annual' ? '19.99' : '39.99';
  };
  
  const getPricingLabel = () => {
    return billingCycle === 'annual' ? 'rocznie' : 'miesięcznie';
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
    <div className="min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Wybierz plan idealny dla siebie
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Niezależnie od tego, czy dopiero zaczynasz, czy jesteś profesjonalistą, 
            mamy plan, który spełni Twoje potrzeby.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <div className="flex justify-center mb-10">
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

        {/* Pricing cards */}
        <motion.div 
          className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Standard Plan */}
          <motion.div variants={itemVariants}>
            <Card className="h-full bg-gray-50 border-gray-200">
              <CardHeader className="pb-8">
                <h2 className="text-3xl font-bold">Standard</h2>
                <p className="text-gray-600 mt-2">
                  Idealne rozwiązanie na początek przygody z copywritingiem.
                </p>
                <div className="mt-6">
                  <span className="text-5xl font-bold">0 PLN</span>
                  <span className="text-gray-500 ml-2">/ {getPricingLabel()}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <Button variant="outline" className="w-full mb-8">
                  Aktualny Plan
                </Button>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>5 briefów i analiz miesięcznie</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Gotowe wytyczne reklamy generowane przez AI</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span>Możliwość napisania:</span>
                      <ul className="ml-7 mt-2 list-disc text-gray-600">
                        <li>E-mail marketingowy</li>
                        <li>Reklama digitalowa</li>
                        <li>Post na social media</li>
                        <li>Landing page</li>
                      </ul>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Podstawowy feedback od AI</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Zapis projektów w aplikacji</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pro Plan */}
          <motion.div variants={itemVariants}>
            <Card className="h-full relative border-copywrite-teal/30 shadow-md">
              <div className="absolute -top-4 inset-x-0 flex justify-center">
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1 px-3 py-1">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span className="font-medium">Most Popular</span>
                </Badge>
              </div>
              <CardHeader className="pb-8 pt-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold">Pro</h2>
                  {billingCycle === 'annual' && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 ml-2">
                      Save 50%
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 mt-2">
                  Zaawansowane funkcje dla profesjonalnego copywritingu.
                </p>
                <div className="mt-6 flex items-center">
                  <span className="text-5xl font-bold">{getProPrice()} PLN</span>
                  <span className="text-gray-500 ml-2">/ {getPricingLabel()}</span>
                  {billingCycle === 'annual' && (
                    <span className="text-gray-400 ml-3 line-through">39.99 PLN</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <Button className="w-full mb-8 bg-copywrite-teal hover:bg-copywrite-teal-dark">
                  Upgrade to Pro
                </Button>
                <ul className="space-y-4">
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
                    <div>
                      <span>Custom Brief Builder™ – Tworzenie własnych spersonalizowanych wytycznych reklamy:</span>
                      <ul className="ml-7 mt-2 list-disc text-gray-600">
                        <li>Własna grupa docelowa</li>
                        <li>Branża, produkt, styl komunikacji</li>
                      </ul>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <span>Możliwość napisania:</span>
                      <ul className="ml-7 mt-2 list-disc text-gray-600">
                        <li>E-mail marketingowy</li>
                        <li>Reklama digitalowa</li>
                        <li>Post na social media</li>
                        <li>Landing page</li>
                      </ul>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Szczegółowy feedback od AI (nagłówki, CTA, dopasowanie)</span>
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
          className="mt-24 text-center"
        >
          <h2 className="text-3xl font-bold mb-12">Masz pytania?</h2>
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
