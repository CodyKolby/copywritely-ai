
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Newspaper, File, Trash2 } from 'lucide-react';
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
    type: 'brief' | 'script';
  };
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete, onOpen }) => {
  const getProjectIcon = () => {
    if (project.type === 'brief') {
      return <FileText className="text-copywrite-teal" />;
    } else if (project.type === 'script') {
      return <Newspaper className="text-copywrite-teal-dark" />;
    } else {
      return <File className="text-gray-400" />;
    }
  };

  const getStatusBadge = (status: 'Draft' | 'Completed' | 'Reviewed') => {
    switch(status) {
      case 'Draft':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Wersja robocza</Badge>;
      case 'Completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ukończony</Badge>;
      case 'Reviewed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Zweryfikowany</Badge>;
      default:
        return <Badge variant="outline">Nieznany</Badge>;
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
              <CardDescription>{formatDate(project.created_at)}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-gray-600 line-clamp-3">{project.content}</p>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <div className="flex justify-between items-center w-full">
            <div>{getStatusBadge(project.status)}</div>
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
