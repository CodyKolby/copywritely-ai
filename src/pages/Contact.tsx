
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';

const Contact = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Email address that will be used for contact
  const emailAddress = "support@copility.com";

  return (
    <div className="pt-24 pb-16 px-6 flex items-center justify-center min-h-[calc(100vh-300px)]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl w-full mx-auto bg-gray-900 p-10 md:p-16 rounded-lg shadow-glass text-center"
      >
        <div className="space-y-8">
          {/* Main heading */}
          <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
            Potrzebujesz pomocy? Żaden problem!
          </h1>
          
          {/* Subheading */}
          <p className="text-lg md:text-xl text-gray-300">
            Jeśli masz jakieś pytania, skontaktuj się z nami pod adresem
          </p>
          
          {/* Email button */}
          <motion.a
            href={`mailto:${emailAddress}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-block mt-8 bg-[#5CFFC0] text-gray-900 font-medium px-8 py-4 rounded text-xl tracking-wide hover:bg-[#4EEDB0] transition-colors duration-200"
          >
            <div className="flex items-center justify-center">
              <Mail className="mr-2 h-5 w-5" />
              {emailAddress}
            </div>
          </motion.a>
        </div>
      </motion.div>
    </div>
  );
};

export default Contact;
