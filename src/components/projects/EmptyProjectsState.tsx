
import React from 'react';

interface EmptyProjectsStateProps {
  isAuthenticated: boolean;
}

const EmptyProjectsState: React.FC<EmptyProjectsStateProps> = ({ isAuthenticated }) => {
  return (
    <div className="text-center p-10 border rounded-lg bg-white">
      <p className="text-gray-500 mb-6">Nie masz jeszcze żadnych projektów.</p>
      {!isAuthenticated && (
        <p className="text-sm text-gray-400">Zaloguj się, aby zobaczyć swoje projekty.</p>
      )}
    </div>
  );
};

export default EmptyProjectsState;
