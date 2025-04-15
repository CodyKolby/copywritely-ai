
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PricingFeatureItem } from "./PricingFeatureItem";
import { useState, useEffect } from "react";

interface PricingCardProps {
  price: string;
  pricingLabel: string;
  isAnnual: boolean;
  isLoading: boolean;
  onSubscribe: () => void;
}

export const PricingCard = ({
  price,
  pricingLabel,
  isAnnual,
  isLoading,
  onSubscribe
}: PricingCardProps) => {
  const [clickCount, setClickCount] = useState(0);
  const [internalLoading, setInternalLoading] = useState(false);
  
  // Synchronizuj stan zewnętrzny ze stanem wewnętrznym
  useEffect(() => {
    setInternalLoading(isLoading);
  }, [isLoading]);
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const features = [
    "Nielimitowana liczba skryptów reklamowych",
    "Nielimitowana liczba postów na social media",
    "Nielimitowana liczba maili sprzedażowych",
    "Dostęp do najnowszej wersji agenta NeuroScript™",
    "Dowolna liczba grup docelowych",
    "Dostęp do zespołu Copility 24/7"
  ];

  // Function to handle the click event with improved logging
  const handleSubscribeClick = () => {
    console.log('Subscribe button clicked in PricingCard component');
    
    // Zapobiegnij wielokrotnym kliknięciom
    if (internalLoading) {
      console.log('Button already in loading state, ignoring click');
      return;
    }
    
    setClickCount(prev => prev + 1);
    setInternalLoading(true);
    
    // Log click count for debugging
    if (clickCount > 0) {
      console.log(`Button clicked ${clickCount + 1} times`);
    }
    
    try {
      // Call the parent onSubscribe function
      onSubscribe();
      
      // Ustawienie timeouta na wypadek, gdyby props isLoading nie został zaktualizowany
      setTimeout(() => {
        if (internalLoading) {
          console.log('Resetting internal loading state after timeout');
          setInternalLoading(false);
        }
      }, 10000);
    } catch (error) {
      console.error('Error in subscribe handler:', error);
      setInternalLoading(false);
    }
  };

  return (
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
            Pełen dostęp do wszystkich funkcji, które pozwolą Ci tworzyć skuteczne skrypty marketingowe i skalować sprzedaż.
          </p>
          <div className="flex items-baseline mb-2">
            <span className="text-5xl font-bold">{price}</span>
            <span className="text-xl ml-1">PLN</span>
            <span className="text-gray-500 ml-2">/ {pricingLabel}</span>
            
            {/* Save 50% badge */}
            {isAnnual && (
              <Badge className="bg-green-100 text-green-700 border-green-200 ml-3">
                50% taniej
              </Badge>
            )}
          </div>
          
          {isAnnual && (
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
            className="w-full mb-6 bg-copywrite-teal hover:bg-copywrite-teal-dark h-12 text-base relative text-white"
            onClick={handleSubscribeClick}
            disabled={internalLoading || isLoading}
          >
            {(internalLoading || isLoading) ? (
              <div className="flex items-center justify-center w-full">
                <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white animate-spin mr-2"></div>
                <span className="text-white">Ładowanie...</span>
              </div>
            ) : (
              'Rozpocznij darmowy okres próbny'
            )}
          </Button>
        </div>
        
        <CardContent className="border-t border-gray-100 bg-gray-50 p-6">
          <ul className="space-y-3">
            {features.map((feature, idx) => (
              <PricingFeatureItem key={idx} text={feature} />
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
};
