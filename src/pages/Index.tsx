
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useRef } from 'react';
import { Lightbulb, Pen, Clipboard } from 'lucide-react';

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

  // Counter animation function
  const Counter = ({ end, label, prefix = '', suffix = '' }) => {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const counterRef = useRef(null);
    
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            let startTime;
            const duration = 2000; // 2 seconds
            
            const animate = (timestamp) => {
              if (!startTime) startTime = timestamp;
              const progress = Math.min((timestamp - startTime) / duration, 1);
              const currentCount = Math.floor(progress * end);
              
              setCount(currentCount);
              
              if (progress < 1) {
                requestAnimationFrame(animate);
              }
            };
            
            requestAnimationFrame(animate);
          }
        },
        { threshold: 0.1 }
      );
      
      if (counterRef.current) {
        observer.observe(counterRef.current);
      }
      
      return () => {
        if (counterRef.current) {
          observer.unobserve(counterRef.current);
        }
      };
    }, [end, hasAnimated]);
    
    const formattedCount = count.toLocaleString('pl-PL');
    
    return (
      <div ref={counterRef} className="flex flex-col items-center">
        <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-copywrite-teal mb-2">
          {prefix}{formattedCount}{suffix}
        </div>
        <div className="text-sm md:text-base text-center max-w-[180px] md:max-w-[220px]">
          {label}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Version Indicator - Only for testing purposes */}
      <div className="fixed bottom-2 right-2 z-50 bg-copywrite-teal text-white text-xs px-2 py-1 rounded-md opacity-70">
        v1.0.9 - Updated features section
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

      {/* Social Proof Section */}
      <section className="py-14 px-6 bg-gray-50">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-6xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <Counter 
              end={17821} 
              label="Wygenerowanych skryptów reklamowych" 
            />
            <Counter 
              end={427} 
              label="Zadowolonych użytkowników Copility" 
            />
            <Counter 
              end={965540} 
              prefix="" 
              suffix=" zł" 
              label="Wygenerowanych przychodów przez naszych klientów" 
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section with white background - Expanded to take more space */}
      <section className="py-32 px-6 bg-white text-gray-900">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-12"
          >
            {/* Card 1 - Updated title */}
            <div className="flex flex-col items-center text-center p-8 bg-white rounded-xl h-full">
              <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center mb-8">
                <Lightbulb className="h-14 w-14 text-copywrite-teal" />
              </div>
              <h3 className="text-2xl font-bold mb-5">Reklamy gotowe w minutę</h3>
              <p className="text-gray-600 text-lg">
                Copility to pierwsze w Polsce w pełni zautomatyzowane narzędzie, które tworzy skrypty reklamowe podnoszące sprzedaż i budujące markę w mniej niż minutę.
              </p>
            </div>

            {/* Card 2 - Updated description */}
            <div className="flex flex-col items-center text-center p-8 bg-white rounded-xl h-full">
              <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center mb-8">
                <Pen className="h-14 w-14 text-copywrite-teal" />
              </div>
              <h3 className="text-2xl font-bold mb-5">Zero pisania</h3>
              <p className="text-gray-600 text-lg">
                Copility nie wymaga od Ciebie pisania nawet jednego zdania. Całą pracę wykonuje za Ciebie nasz autorski agent <span className="font-bold">NeuroScript™</span>
              </p>
            </div>

            {/* Card 3 - Updated COPILITY to Copility */}
            <div className="flex flex-col items-center text-center p-8 bg-white rounded-xl h-full">
              <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center mb-8">
                <Clipboard className="h-14 w-14 text-copywrite-teal" />
              </div>
              <h3 className="text-2xl font-bold mb-5">Prosta ścieżka</h3>
              <p className="text-gray-600 text-lg">
                Opisujesz swój produkt.<br />
                Copility myśli za Ciebie.<br />
                Twój skrypt jest gotowy.<br />
                Klikasz. Publikujesz. Sprzedajesz.
              </p>
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
