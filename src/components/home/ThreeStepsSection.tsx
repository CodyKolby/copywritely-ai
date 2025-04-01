
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

const stepImages = [
  "/lovable-uploads/53691d1f-6795-4432-b53f-05aff7aa243d.png", // Script Generator
  "/lovable-uploads/6fd384b6-9305-47f2-87b0-25a584df0ab4.png", // Target Audience
  "/lovable-uploads/fb0e24c1-1855-4fe4-9292-44b5519c948d.png"  // Next Step
];

const ThreeStepsSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container px-4 mx-auto">
        <motion.h2 
          className="text-3xl md:text-4xl font-bold text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          Jak Copility tworzy skrypty, które sprzedają i budują markę w 3 krokach
        </motion.h2>

        <div className="space-y-20">
          {/* Step 1 */}
          <motion.div 
            className="grid md:grid-cols-2 gap-10 items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="space-y-6">
              <div className="bg-copywrite-teal text-white text-sm font-semibold px-3 py-1 rounded-full w-fit">
                Krok 1
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                Copility umożliwiając tworzenie skryptów na wszystkie najważniejsze kanały, pozwala Ci budować rozpoznawalną markę i skutecznie zwiększać sprzedaż nawet o 30%
              </h3>
              <p className="text-gray-600 text-lg">
                Copility skutecznie tworzy skrypty na wszystkie najważniejsze kanały sprzedażowe jak social media, reklamy internetowe i e-maile. Co oznacza, że za pomocą jednego narzędzia rozwijasz swoje profile, budujesz markę i maksymalizujesz sprzedaż.
              </p>
            </div>
            <Card className="overflow-hidden shadow-soft border-0">
              <CardContent className="p-0">
                <img 
                  src={stepImages[0]} 
                  alt="Generator Skryptów AI" 
                  className="w-full h-auto object-cover"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Step 2 */}
          <motion.div 
            className="grid md:grid-cols-2 gap-10 items-center md:flex-row-reverse"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="space-y-6 md:order-2">
              <div className="bg-copywrite-teal text-white text-sm font-semibold px-3 py-1 rounded-full w-fit">
                Krok 2
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                Copility trafia dokładnie w Twojego idealnego klienta, bo opiera się na informacjach, które sam dostarczasz o swojej grupie docelowej
              </h3>
              <p className="text-gray-600 text-lg">
                To podejście sprawia, że Copility osiąga nawet 87,5% wyższą skuteczność niż standardowe rozwiązania, co otwiera przestrzeń na wzrost sprzedaży i realne skalowanie Twojego biznesu
              </p>
            </div>
            <Card className="overflow-hidden shadow-soft border-0 md:order-1">
              <CardContent className="p-0">
                <img 
                  src={stepImages[1]} 
                  alt="Wybór grupy docelowej" 
                  className="w-full h-auto object-cover"
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Step 3 */}
          <motion.div 
            className="grid md:grid-cols-2 gap-10 items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="space-y-6">
              <div className="bg-copywrite-teal text-white text-sm font-semibold px-3 py-1 rounded-full w-fit">
                Krok 3
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
                Copility pozwala Ci precyzyjnie określić cel materiału, a następnie tworzy skrypt dopasowany do konkretnej sytuacji
              </h3>
              <p className="text-gray-600 text-lg">
                To znacząco rozszerza możliwości wykorzystania narzędzia w każdej kampanii i dla każdego rodzaju komunikatu.
              </p>
            </div>
            <Card className="overflow-hidden shadow-soft border-0">
              <CardContent className="p-0">
                <img 
                  src={stepImages[2]} 
                  alt="Określenie celu reklamy" 
                  className="w-full h-auto object-cover"
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ThreeStepsSection;
