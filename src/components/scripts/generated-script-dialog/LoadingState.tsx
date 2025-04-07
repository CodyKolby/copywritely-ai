
import React from 'react';
import { Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface LoadingStateProps {
  stage?: 'hooks' | 'script' | 'finalization';
}

const LoadingState = ({ stage = 'hooks' }: LoadingStateProps) => {
  let baseProgress = 0;
  let stageText = '';
  
  if (stage === 'hooks') {
    baseProgress = 10;
    stageText = 'Generowanie hooków i angles';
  } else if (stage === 'script') {
    baseProgress = 40;
    stageText = 'Tworzenie głównej treści';
  } else if (stage === 'finalization') {
    baseProgress = 75;
    stageText = 'Finalizacja skryptu';
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] py-10 bg-white">
      <div className="relative mb-6">
        <div className="flex items-center justify-center p-6 rounded-full bg-copywrite-teal bg-opacity-10 h-24 w-24">
          <Activity className="h-12 w-12 text-copywrite-teal animate-pulse" />
        </div>
      </div>
      
      <div className="text-center mb-6">
        <p className="text-gray-600 text-sm">{stageText}</p>
      </div>
      
      <div className="w-48">
        <Progress value={baseProgress} className="h-2" />
      </div>
      
      <div className="flex justify-center space-x-2 mt-3">
        <div className={`h-2 w-2 rounded-full ${stage === 'hooks' ? 'bg-copywrite-teal' : 'bg-gray-200'}`}></div>
        <div className={`h-2 w-2 rounded-full ${stage === 'script' ? 'bg-copywrite-teal' : 'bg-gray-200'}`}></div>
        <div className={`h-2 w-2 rounded-full ${stage === 'finalization' ? 'bg-copywrite-teal' : 'bg-gray-200'}`}></div>
      </div>
    </div>
  );
};

export default LoadingState;
