
import React, { useState } from 'react';
import { Activity, FileText, Rocket, Target, Briefcase } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useInterval } from '@/hooks/use-interval';

interface LoadingStateProps {
  stage?: 'hooks' | 'script' | 'finalization';
}

const LoadingState = ({ stage = 'hooks' }: LoadingStateProps) => {
  let baseProgress = 0;
  
  if (stage === 'hooks') {
    baseProgress = 10;
  } else if (stage === 'script') {
    baseProgress = 40;
  } else if (stage === 'finalization') {
    baseProgress = 75;
  }
  
  const [progress, setProgress] = useState(baseProgress);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const loadingSteps = {
    hooks: [
      {
        icon: Activity,
        text: "Generowanie hooków i angles"
      },
      {
        icon: Target,
        text: "Analizowanie grupy docelowej"
      },
      {
        icon: Rocket,
        text: "Przygotowanie strategii"
      },
      {
        icon: FileText,
        text: "Tworzenie wstępnych koncepcji"
      },
      {
        icon: Briefcase,
        text: "Dobieranie najlepszych rozwiązań"
      }
    ],
    script: [
      {
        icon: FileText,
        text: "Tworzenie głównej treści"
      },
      {
        icon: Activity,
        text: "Optymalizowanie przekazu"
      },
      {
        icon: Target,
        text: "Dostosowywanie do odbiorcy"
      },
      {
        icon: Briefcase,
        text: "Wzmacnianie argumentacji"
      },
      {
        icon: Rocket,
        text: "Dopracowywanie szczegółów"
      }
    ],
    finalization: [
      {
        icon: Rocket,
        text: "Finalizacja skryptu"
      },
      {
        icon: FileText,
        text: "Sprawdzanie poprawności"
      },
      {
        icon: Target,
        text: "Optymalizacja perswazji"
      },
      {
        icon: Activity,
        text: "Przygotowanie do publikacji"
      },
      {
        icon: Briefcase,
        text: "Ostatnie szlify"
      }
    ]
  };
  
  // Simulate loading progress within the current stage
  useInterval(() => {
    const maxForStage = stage === 'hooks' ? 35 : stage === 'script' ? 70 : 95;
    setProgress((prev) => Math.min(prev + 3, maxForStage));
  }, 1000);
  
  // Cycle through different icons and texts
  useInterval(() => {
    setCurrentStepIndex((prev) => (prev + 1) % loadingSteps[stage].length);
  }, 3000);
  
  const currentStepList = loadingSteps[stage];
  const currentStep = currentStepList[currentStepIndex];
  const IconComponent = currentStep.icon;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[350px] py-12 px-8 bg-white rounded-xl w-full">
      <div className="mb-8">
        <div className="flex items-center justify-center p-6 rounded-full bg-copywrite-teal bg-opacity-10 h-24 w-24">
          <IconComponent className="h-12 w-12 text-copywrite-teal animate-pulse" />
        </div>
      </div>
      
      <div className="text-center mb-8">
        <p className="text-gray-600 text-lg">{currentStep.text}</p>
      </div>
      
      <div className="w-72 mt-4">
        <Progress value={progress} className="h-2 bg-gray-100" indicatorClassName="bg-copywrite-teal" />
      </div>
    </div>
  );
};

export default LoadingState;
