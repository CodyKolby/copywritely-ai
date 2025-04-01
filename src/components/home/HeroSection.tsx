
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
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
  );
};

export default HeroSection;
