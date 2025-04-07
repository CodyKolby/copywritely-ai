
import React, { useState, useEffect } from 'react';
import { HexagonalLoading } from '@/components/ui/hexagonal-loading';

interface LoadingStateProps {
  stage?: 'hooks' | 'script' | 'finalization';
}

const LoadingState = ({ stage = 'hooks' }: LoadingStateProps) => {
  const [progress, setProgress] = useState(0);
  
  // Simulate progress for visual feedback based on stage
  useEffect(() => {
    const startTime = Date.now();
    let duration = 20000; // Default duration
    
    // Adjust duration based on stage
    if (stage === 'hooks') duration = 20000; // 20s for hooks
    else if (stage === 'script') duration = 30000; // 30s for script
    else if (stage === 'finalization') duration = 15000; // 15s for finalization
    
    // Base progress for each stage
    let baseProgress = 0;
    if (stage === 'script') baseProgress = 33;
    else if (stage === 'finalization') baseProgress = 66;
    
    const maxStageProgress = stage === 'finalization' ? 100 : baseProgress + 33;
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const stageProgress = Math.min(33, (elapsed / duration) * 33);
      setProgress(baseProgress + stageProgress);
      
      if (baseProgress + stageProgress >= maxStageProgress) {
        clearInterval(timer);
      }
    }, 500);
    
    return () => clearInterval(timer);
  }, [stage]);
  
  return (
    <div className="py-8 flex flex-col items-center justify-center min-h-[400px]">
      <HexagonalLoading progress={progress} />
      
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
