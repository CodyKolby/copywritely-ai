
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import BriefCard, { Brief } from '@/components/BriefCard';
import { ArrowRight } from 'lucide-react';

interface GeneratedBriefDisplayProps {
  isLoading: boolean;
  generatedBrief: Brief | null;
  onResetBrief: () => void;
  projectSaved?: boolean;
  projectId?: string | null;
  onViewProject?: () => void;
}

const GeneratedBriefDisplay = ({ 
  isLoading, 
  generatedBrief, 
  onResetBrief,
  projectSaved = false,
  projectId = null,
  onViewProject
}: GeneratedBriefDisplayProps) => {  
  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold text-gray-900">
          Twój wygenerowany brief
        </h2>
        <div className="flex gap-2">
          {projectSaved && projectId && onViewProject && (
            <Button
              onClick={onViewProject}
              className="bg-copywrite-teal hover:bg-copywrite-teal-dark text-white"
            >
              Zobacz w projektach
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={onResetBrief}
            className="border-copywrite-teal text-copywrite-teal hover:bg-copywrite-teal/5"
          >
            Wygeneruj nowy brief
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl overflow-hidden shadow-soft border border-gray-100">
          <div className="p-6 md:p-8">
            <Skeleton className="h-8 w-2/3 mb-6" />
            
            <div className="mb-6">
              <Skeleton className="h-6 w-1/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
            
            <div className="mb-6">
              <Skeleton className="h-6 w-1/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
            
            <div className="mb-6">
              <Skeleton className="h-6 w-1/4 mb-2" />
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-4 w-4/5 mb-1" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            
            <div className="mb-6">
              <Skeleton className="h-6 w-1/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>
            
            <div>
              <Skeleton className="h-6 w-1/4 mb-2" />
              <Skeleton className="h-4 w-2/3 mb-1" />
              <Skeleton className="h-4 w-3/4 mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      ) : (
        generatedBrief && <BriefCard brief={generatedBrief} />
      )}
    </div>
  );
};

export default GeneratedBriefDisplay;
