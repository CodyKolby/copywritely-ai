
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

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

      {/* Features Section with white background (changed from black) */}
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
            <div className="flex justify-end">
              <div className="bg-copywrite-teal-light p-6 rounded-lg">
                <div className="text-copywrite-teal font-mono text-3xl md:text-4xl font-bold">1 min</div>
                <div className="text-copywrite-teal text-sm">Czas napisania skryptu</div>
              </div>
            </div>
          </motion.div>

          {/* Second row - reversed order as requested */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="grid md:grid-cols-2 gap-8 items-center mb-20 border border-gray-200 rounded-xl p-8 bg-white shadow-sm"
          >
            <div className="flex justify-center">
              <div className="relative">
                <div className="bg-copywrite-teal-light rounded-lg p-6 grid grid-cols-2 gap-4">
                  <div className="border-2 border-copywrite-teal/50 rounded-lg aspect-square flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-copywrite-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="border-2 border-copywrite-teal/50 rounded-lg aspect-square flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-copywrite-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute -inset-10 bg-copywrite-teal/5 rounded-full blur-xl -z-10"></div>
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-800">
                COPILITY nie wymaga od Ciebie pisania nawet jednego zdania.
              </h2>
              {/* Removed the "zero pisania" text as requested */}
            </div>
          </motion.div>

          {/* Third row */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="grid md:grid-cols-2 gap-8 items-center border border-gray-200 rounded-xl p-8 bg-white shadow-sm"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-800">Opisujesz swój produkt</p>
                <p className="text-lg font-semibold text-gray-800">COPILITY myśli za Ciebie</p>
                <p className="text-lg font-semibold text-gray-800">Twój skrypt jest gotowy</p>
                <p className="text-lg font-semibold text-gray-800">Klikasz. Publikujesz. Sprzedajesz.</p>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-copywrite-teal-light p-4 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-copywrite-teal" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
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
