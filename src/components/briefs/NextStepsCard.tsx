
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const NextStepsCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-gray-50 rounded-xl p-6 md:p-8 mb-8"
    >
      <h2 className="text-xl font-semibold text-gray-900 mb-4">What to do next?</h2>
      <p className="text-gray-700 mb-4">
        Use this brief as a guideline to practice your copywriting skills. Once you've 
        written your copy based on this brief, head over to the Copy Editor to submit it 
        for AI analysis and feedback.
      </p>
      <Link to="/copy-editor">
        <Button 
          className="bg-copywrite-teal hover:bg-copywrite-teal-dark transition-colors"
        >
          Go to Copy Editor
        </Button>
      </Link>
    </motion.div>
  );
};

export default NextStepsCard;
