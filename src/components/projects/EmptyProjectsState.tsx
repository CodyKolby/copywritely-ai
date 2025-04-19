
import React from 'react';
import { Link } from 'react-router-dom';
import { FilePlus } from 'lucide-react';
import { Button } from "@/components/ui/button";

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
        <Button asChild>
          <Link to="/script-generator" className="gap-2">
            <FilePlus className="h-4 w-4" />
            <span>Stwórz projekt</span>
          </Link>
        </Button>
      )}
    </div>
  );
};

export default EmptyProjectsState;
