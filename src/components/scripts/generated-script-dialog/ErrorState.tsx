
import React from 'react';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => {
  return (
    <div className="py-8 text-center">
      <p className="text-red-500">{error}</p>
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
