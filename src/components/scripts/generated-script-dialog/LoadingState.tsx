
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  stage?: 'hooks' | 'script' | 'finalization';
}

const LoadingState = ({ stage = 'hooks' }: LoadingStateProps) => {
  // Teksty dla poszczególnych etapów
  const stageMessages = {
    hooks: 'Generujemy hooki i angles dla Twojej grupy docelowej...',
    script: 'Tworzymy główną treść skryptu w oparciu o wybrany hook...',
    finalization: 'Finalizujemy skrypt, dopasowując najlepszy hook i format...'
  };

  // Czas oczekiwania dla poszczególnych etapów
  const stageTimes = {
    hooks: '15-30 sekund',
    script: '20-40 sekund',
    finalization: '10-20 sekund'
  };

  return (
    <div className="py-8 space-y-4">
      <div className="flex justify-center mb-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-copywrite-teal"></div>
      </div>
      
      <p className="text-center text-gray-500">{stageMessages[stage]}</p>
      <p className="text-center text-gray-400 text-sm">To może potrwać około {stageTimes[stage]}</p>
      
      <div className="space-y-4 mt-6">
        <div className="flex justify-center space-x-2">
          <div className={`h-2.5 w-2.5 rounded-full ${stage === 'hooks' ? 'bg-copywrite-teal' : 'bg-gray-200'}`}></div>
          <div className={`h-2.5 w-2.5 rounded-full ${stage === 'script' ? 'bg-copywrite-teal' : 'bg-gray-200'}`}></div>
          <div className={`h-2.5 w-2.5 rounded-full ${stage === 'finalization' ? 'bg-copywrite-teal' : 'bg-gray-200'}`}></div>
        </div>
        
        <div className="text-center text-xs text-gray-400">
          {stage === 'hooks' && 'Etap 1: Generowanie hooków i angles'}
          {stage === 'script' && 'Etap 2: Tworzenie głównej treści'}
          {stage === 'finalization' && 'Etap 3: Finalizacja skryptu'}
        </div>
      </div>
      
      <div className="space-y-2 mt-4">
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
