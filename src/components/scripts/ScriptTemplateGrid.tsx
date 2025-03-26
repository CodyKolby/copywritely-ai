
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScriptTemplate } from '@/data/scriptTemplates';

interface ScriptTemplateGridProps {
  templates: ScriptTemplate[];
  onSelectTemplate: (templateId: string) => void;
}

const ScriptTemplateGrid = ({ templates, onSelectTemplate }: ScriptTemplateGridProps) => {
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
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{template.title}</h3>
            {template.comingSoon && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Wkrótce
              </Badge>
            )}
          </div>
          <p className="text-gray-600 mb-6 flex-grow">{template.description}</p>
          <Button 
            onClick={() => onSelectTemplate(template.id)}
            className={`w-full ${template.comingSoon ? 'bg-gray-300 hover:bg-gray-300 cursor-not-allowed' : 'bg-copywrite-teal hover:bg-copywrite-teal-dark text-white'} transition-colors`}
            disabled={template.comingSoon}
          >
            {template.comingSoon ? 'Wkrótce dostępne' : 'Stwórz skrypt'}
          </Button>
        </motion.div>
      ))}
    </div>
  );
};

export default ScriptTemplateGrid;
