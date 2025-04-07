
import React, { useState, useEffect } from 'react';
import { HexagonalLoading } from '@/components/ui/hexagonal-loading';

const LoadingState = () => {
  const [progress, setProgress] = useState(0);
  
  // Simulate progress for visual feedback
  useEffect(() => {
    const startTime = Date.now();
    const duration = 30000; // 30 seconds expected loading time
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(95, (elapsed / duration) * 100);
      setProgress(newProgress);
      
      if (newProgress >= 95) {
        clearInterval(timer);
      }
    }, 500);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
      <HexagonalLoading progress={progress} />
    </div>
  );
};

export default LoadingState;
