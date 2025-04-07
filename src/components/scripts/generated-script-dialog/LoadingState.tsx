
import React from 'react';
import { HexagonalLoading } from '@/components/ui/hexagonal-loading';

interface LoadingStateProps {
  stage?: 'hooks' | 'script' | 'finalization';
}

const LoadingState = ({ stage = 'hooks' }: LoadingStateProps) => {
  let baseProgress = 0;
  if (stage === 'script') baseProgress = 33;
  else if (stage === 'finalization') baseProgress = 66;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-white">
      <HexagonalLoading progress={baseProgress} />
      
      <div className="flex justify-center space-x-2 mt-6">
        <div className={`h-2.5 w-2.5 rounded-full ${stage === 'hooks' ? 'bg-copywrite-teal' : 'bg-gray-200'}`}></div>
        <div className={`h-2.5 w-2.5 rounded-full ${stage === 'script' ? 'bg-copywrite-teal' : 'bg-gray-200'}`}></div>
        <div className={`h-2.5 w-2.5 rounded-full ${stage === 'finalization' ? 'bg-copywrite-teal' : 'bg-gray-200'}`}></div>
      </div>
      
      <div className="text-center text-xs text-gray-400 mt-1">
        {stage === 'hooks' && 'Etap 1: Generowanie hooków i angles'}
        {stage === 'script' && 'Etap 2: Tworzenie głównej treści'}
        {stage === 'finalization' && 'Etap 3: Finalizacja skryptu'}
      </div>
    </div>
  );
};

export default LoadingState;
