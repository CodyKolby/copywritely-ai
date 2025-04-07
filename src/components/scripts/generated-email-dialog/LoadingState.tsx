
import React from 'react';
import { HexagonalLoading } from '@/components/ui/hexagonal-loading';

const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-white">
      <HexagonalLoading />
    </div>
  );
};

export default LoadingState;
