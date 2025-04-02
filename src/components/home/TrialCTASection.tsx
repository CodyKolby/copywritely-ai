
import React from 'react';
import { motion } from 'framer-motion';

const TrialCTASection = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <section className="py-16 px-6 bg-white">
      <div className="container mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <div className="max-w-2xl mx-auto bg-gray-800 text-white p-8 rounded-lg shadow-lg">
            <div className="flex flex-col md:items-start text-left">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Bądź następny. Skorzystaj z limitowanej opcji darmowych 3 dni próbnych.
              </h2>
              <p className="text-gray-300">
                Wypróbuj Copility bez ryzyka i przekonaj się, jak łatwo możesz tworzyć skuteczne treści, które zwiększą Twoją sprzedaż i zbudują markę osobistą.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrialCTASection;
