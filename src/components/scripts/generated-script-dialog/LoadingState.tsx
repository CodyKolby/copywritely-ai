
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const LoadingState = () => {
  return (
    <div className="py-8 space-y-4">
      <div className="flex justify-center mb-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-copywrite-teal"></div>
      </div>
      <p className="text-center text-gray-500">Generujemy skrypt dla Twojej grupy docelowej...</p>
      <p className="text-center text-gray-400 text-sm">To może potrwać około 15-30 sekund</p>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
};

export default LoadingState;
