
import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  stage?: 'hooks' | 'content';
}

const LoadingState = ({ stage }: LoadingStateProps) => {
  const message = stage === 'content' 
    ? 'Generowanie treści z nowym hookiem...'
    : 'Generowanie posta do mediów społecznościowych...';
    
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="animate-spin mb-4">
        <Loader2 className="h-10 w-10 text-copywrite-teal" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{message}</h3>
      <p className="text-gray-500 text-center max-w-sm">
        Za chwilę otrzymasz gotowy post dopasowany do Twojej grupy docelowej i wybranej platformy.
      </p>
    </div>
  );
};

export default LoadingState;
