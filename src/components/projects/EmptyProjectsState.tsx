
import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyProjectsStateProps {
  isAuthenticated: boolean;
}

const EmptyProjectsState: React.FC<EmptyProjectsStateProps> = ({ isAuthenticated }) => {
  return (
    <div className="text-center p-10 border rounded-lg bg-white">
      <p className="text-gray-500 mb-6">Nie masz jeszcze żadnych projektów.</p>
      {!isAuthenticated ? (
        <p className="text-sm text-gray-400">Zaloguj się, aby zobaczyć swoje projekty.</p>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/brief-generator">
            <Button className="bg-copywrite-teal hover:bg-copywrite-teal-dark flex items-center gap-2 w-full sm:w-auto">
              <FileText size={18} />
              <span>Stwórz brief</span>
            </Button>
          </Link>
          <Link to="/script-generator">
            <Button className="bg-copywrite-teal-dark hover:bg-copywrite-teal flex items-center gap-2 w-full sm:w-auto">
              <Newspaper size={18} />
              <span>Stwórz skrypt</span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default EmptyProjectsState;
