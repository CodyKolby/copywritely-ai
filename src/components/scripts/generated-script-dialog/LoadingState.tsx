
import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useInterval } from '@/hooks/use-interval';

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
  
  const [progress, setProgress] = useState(baseProgress);
  
  // Simulate loading progress within the current stage
  useInterval(() => {
    const maxForStage = stage === 'hooks' ? 35 : stage === 'script' ? 70 : 95;
    setProgress((prev) => Math.min(prev + 3, maxForStage));
  }, 1000);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[250px] py-8 bg-white rounded-xl">
      <div className="mb-6">
        <div className="flex items-center justify-center p-6 rounded-full bg-copywrite-teal bg-opacity-10 h-24 w-24">
          <Activity className="h-12 w-12 text-copywrite-teal animate-pulse" />
        </div>
      </div>
      
      <div className="text-center mb-6">
        <p className="text-gray-600 text-sm">{stageText}</p>
      </div>
      
      <div className="w-48 mt-2">
        <Progress value={progress} className="h-2 bg-gray-100" indicatorClassName="bg-copywrite-teal" />
      </div>
    </div>
  );
};

export default LoadingState;
