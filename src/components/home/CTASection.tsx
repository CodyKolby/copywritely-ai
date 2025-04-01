
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CTASection = () => {
  return (
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
            Przekonaj się, jak Copility może pomóc Twojemu biznesowi
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Dołącz do 427+ zadowolonych użytkowników i zacznij tworzyć skuteczne skrypty sprzedażowe już dziś.
          </p>
          <Link to="/script-generator">
            <Button className="h-12 px-8 rounded-lg bg-white text-copywrite-teal hover:bg-gray-100 transition-colors">
              Wypróbuj za darmo
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
