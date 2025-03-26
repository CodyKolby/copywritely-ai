
import { motion } from 'framer-motion';

const BriefGeneratorHeader = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center mb-12"
    >
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        AI Brief Generator
      </h1>
      <p className="text-xl text-gray-600 max-w-3xl mx-auto">
        Generate creative briefs for your copywriting practice. Select a template to get started.
      </p>
    </motion.div>
  );
};

export default BriefGeneratorHeader;
