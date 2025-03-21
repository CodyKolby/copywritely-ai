
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface Brief {
  title: string;
  objective: string;
  audience: string;
  keyMessages: string[];
  callToAction: string;
  additionalInfo: string[];
}

interface BriefCardProps {
  brief: Brief;
  className?: string;
}

const BriefCard = ({ brief, className }: BriefCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'bg-copywrite-teal-light border border-copywrite-teal/10 rounded-xl overflow-hidden shadow-soft',
        className
      )}
    >
      <div className="p-6 md:p-8">
        <h2 className="text-copywrite-teal text-2xl font-semibold mb-6">{brief.title}</h2>
        
        <section className="mb-6">
          <h3 className="text-copywrite-teal text-xl font-medium mb-2">Objective:</h3>
          <p className="text-gray-700">{brief.objective}</p>
        </section>
        
        <section className="mb-6">
          <h3 className="text-copywrite-teal text-xl font-medium mb-2">Audience:</h3>
          <p className="text-gray-700">{brief.audience}</p>
        </section>
        
        <section className="mb-6">
          <h3 className="text-copywrite-teal text-xl font-medium mb-2">Key Messages:</h3>
          <ul className="list-disc pl-5 space-y-1">
            {brief.keyMessages.map((message, index) => (
              <li key={index} className="text-gray-700">{message}</li>
            ))}
          </ul>
        </section>
        
        <section className="mb-6">
          <h3 className="text-copywrite-teal text-xl font-medium mb-2">Call to Action:</h3>
          <p className="text-gray-700">{brief.callToAction}</p>
        </section>
        
        <section>
          <h3 className="text-copywrite-teal text-xl font-medium mb-2">Additional Information:</h3>
          <ul className="list-disc pl-5 space-y-1">
            {brief.additionalInfo.map((info, index) => (
              <li key={index} className="text-gray-700">{info}</li>
            ))}
          </ul>
        </section>
      </div>
    </motion.div>
  );
};

export default BriefCard;
