
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Newspaper, File, Trash2, Mail, Share2 } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    content: string;
    status: 'Draft' | 'Completed' | 'Reviewed';
    created_at: string;
    type: 'brief' | 'script' | 'email' | 'social';
    subtype?: string;
  };
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete, onOpen }) => {
  const getProjectIcon = () => {
    if (project.type === 'brief') {
      return <FileText className="text-copywrite-teal" />;
    } else if (project.type === 'script' || project.subtype === 'ad') {
      return <Newspaper className="text-copywrite-teal-dark" />;
    } else if (project.type === 'email') {
      return <Mail className="text-blue-600" />;
    } else if (project.type === 'social') {
      return <Share2 className="text-purple-600" />;
    } else {
      return <File className="text-gray-400" />;
    }
  };
  
  const getProjectTypeName = () => {
    if (project.type === 'brief') {
      return "Brief";
    } else if (project.type === 'script' || project.subtype === 'ad') {
      return "Reklama internetowa";
    } else if (project.type === 'email') {
      return "Mail marketingowy";
    } else if (project.type === 'social') {
      return "Post na social media";
    } else {
      return "Tekst";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-center gap-2">
            {getProjectIcon()}
            <div className="flex-1">
              <CardTitle className="text-lg">{project.title}</CardTitle>
              <div className="flex items-center gap-2">
                <CardDescription>{formatDate(project.created_at)}</CardDescription>
                <Badge variant="secondary" className="text-xs font-normal">
                  {getProjectTypeName()}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-gray-600 line-clamp-3">{project.content}</p>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <div className="flex justify-between items-center w-full">
            <div>
              {/* Status badge has been removed as requested */}
            </div>
            <div className="flex gap-2">
              <button 
                className="text-sm text-copywrite-teal hover:text-copywrite-teal-dark transition-colors"
                onClick={() => onOpen(project.id)}
              >
                Otwórz
              </button>
              <button 
                className="text-sm text-red-500 hover:text-red-700 transition-colors ml-4"
                onClick={() => onDelete(project.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ProjectCard;
