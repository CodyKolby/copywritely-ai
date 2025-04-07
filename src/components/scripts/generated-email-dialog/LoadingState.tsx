
import React from 'react';
import { Mail } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] py-10 bg-white">
      <div className="relative mb-6">
        <div className="flex items-center justify-center p-6 rounded-full bg-copywrite-teal bg-opacity-10 h-24 w-24">
          <Mail className="h-12 w-12 text-copywrite-teal animate-pulse" />
        </div>
      </div>
      
      <div className="text-center mb-6">
        <p className="text-gray-600 text-sm">Dobieranie najlepszego stylu pisania</p>
      </div>
      
      <div className="w-48">
        <Progress value={35} className="h-2" />
      </div>
    </div>
  );
};

export default LoadingState;
