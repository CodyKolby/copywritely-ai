
import React from 'react';

interface ErrorStateProps {
  error: Error | string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  // Convert error to string if it's an Error object
  const errorMessage = error instanceof Error ? error.message : error;
  
  return (
    <div className="py-8 text-center">
      <p className="text-red-500">{errorMessage}</p>
      <button 
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-copywrite-teal text-white rounded-md hover:bg-copywrite-teal-dark"
      >
        Spróbuj ponownie
      </button>
    </div>
  );
};

export default ErrorState;
