
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export interface BriefTemplate {
  id: string;
  title: string;
  description: string;
}

interface BriefTemplateGridProps {
  templates: BriefTemplate[];
  onSelectTemplate: (templateId: string) => void;
}

const BriefTemplateGrid = ({ templates, onSelectTemplate }: BriefTemplateGridProps) => {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {templates.map((template, index) => (
        <motion.div
          key={template.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="bg-white rounded-xl p-6 shadow-soft border border-gray-100 flex flex-col"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{template.title}</h3>
          <p className="text-gray-600 mb-6 flex-grow">{template.description}</p>
          <Button 
            onClick={() => onSelectTemplate(template.id)}
            className="w-full bg-copywrite-teal hover:bg-copywrite-teal-dark transition-colors"
          >
            Generate Brief
          </Button>
        </motion.div>
      ))}
    </div>
  );
};

export default BriefTemplateGrid;
