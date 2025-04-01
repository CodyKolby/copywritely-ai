import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { TrendingUp } from 'lucide-react';

const Index = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Version Indicator - Only for testing purposes */}
      <div className="fixed bottom-2 right-2 z-50 bg-copywrite-teal text-white text-xs px-2 py-1 rounded-md opacity-70">
        v1.0.7 - Updated homepage features
      </div>
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6 leading-tight"
            >
              Skrypty reklamowe, które podnoszą sprzedaż i budują markę.
              <br className="hidden md:block" />
              <span className="text-copywrite-teal">Bez stresu. Bez myślenia. W 30 sekund.</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-gray-600 max-w-3xl mx-auto mb-10"
            >
              Copility to AI stworzone przez topowych sprzedawców,
              oparte na tysiącach kampanii i sprawdzonych strukturach, 
              <span className="underline font-medium"> średnio zwiększając skuteczność sprzedaży o 30%.</span>
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/brief-generator">
                <Button className="h-12 px-8 rounded-lg text-white bg-copywrite-teal hover:bg-copywrite-teal-dark transition-colors">
                  Wypróbuj za darmo
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section with white background */}
      <section className="py-20 px-6 bg-white text-gray-900">
        <div className="max-w-6xl mx-auto">
          {/* First row */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="grid md:grid-cols-2 gap-8 items-center mb-20 border border-gray-200 rounded-xl p-8 bg-white shadow-sm"
          >
            <div className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold leading-tight text-gray-800">
                COPILITY to pierwsze w Polsce w pełni zautomatyzowane narzędzie, które tworzy skrypty reklamowe podnoszące sprzedaż i budujące markę w mniej niż minutę.
              </h2>
            </div>
            <div className="flex justify-center">
              <div className="flex items-center rounded-lg">
                <div className="text-copywrite-teal font-mono text-3xl md:text-4xl font-bold">1 min</div>
                <div className="text-copywrite-teal text-sm ml-2">Czas napisania skryptu</div>
              </div>
            </div>
          </motion.div>

          {/* Second row - with puzzle icon */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="grid md:grid-cols-2 gap-12 items-center mb-20 border border-gray-200 rounded-xl p-10 bg-white shadow-sm"
          >
            <div className="flex justify-center md:justify-end order-last md:order-first">
              <img 
                src="/lovable-uploads/bb05d90b-551e-4dc2-94dd-5d4f5b8341ed.png" 
                alt="Puzzle icon with transparent background" 
                className="h-32 w-auto"
              />
            </div>
            <div className="flex items-center">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                COPILITY nie wymaga od Ciebie pisania nawet jednego zdania.
              </h2>
            </div>
          </motion.div>

          {/* Third row - with trending up icon */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="grid md:grid-cols-2 gap-12 items-center border border-gray-200 rounded-xl p-10 bg-white shadow-sm"
          >
            <div className="flex items-center">
              <div className="space-y-3">
                <p className="text-lg font-semibold text-gray-800">Opisujesz swój produkt</p>
                <p className="text-lg font-semibold text-gray-800">COPILITY myśli za Ciebie</p>
                <p className="text-lg font-semibold text-gray-800">Twój skrypt jest gotowy</p>
                <p className="text-lg font-semibold text-gray-800">Klikasz. Publikujesz. Sprzedajesz.</p>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <TrendingUp className="h-32 w-32 text-copywrite-teal" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-copywrite-teal rounded-2xl p-8 md:p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to improve your copywriting skills?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Start with AI-generated briefs and get instant feedback on your writing.
            </p>
            <Link to="/brief-generator">
              <Button className="h-12 px-8 rounded-lg bg-white text-copywrite-teal hover:bg-gray-100 transition-colors">
                Wypróbuj za darmo
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 bg-gray-50 mt-auto">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600">
            © {new Date().getFullYear()} Copility. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
