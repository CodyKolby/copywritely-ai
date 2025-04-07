
import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useInterval } from '@/hooks/use-interval';

const LoadingState = () => {
  const [progress, setProgress] = useState(10);
  
  // Simulate loading progress
  useInterval(() => {
    setProgress((prev) => Math.min(prev + 5, 90));
  }, 800);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[250px] py-8 bg-white rounded-xl">
      <div className="mb-6">
        <div className="flex items-center justify-center p-6 rounded-full bg-copywrite-teal bg-opacity-10 h-24 w-24">
          <Mail className="h-12 w-12 text-copywrite-teal animate-pulse" />
        </div>
      </div>
      
      <div className="text-center mb-6">
        <p className="text-gray-600 text-sm">Dobieranie najlepszego stylu pisania</p>
      </div>
      
      <div className="w-48 mt-2">
        <Progress value={progress} className="h-2 bg-gray-100" indicatorClassName="bg-copywrite-teal" />
      </div>
    </div>
  );
};

export default LoadingState;
