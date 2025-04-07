
import React, { useState } from 'react';
import { Mail, FileText, MessageCircle, Edit, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useInterval } from '@/hooks/use-interval';

const LoadingState = () => {
  const [progress, setProgress] = useState(10);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const loadingSteps = [
    {
      icon: Mail,
      text: "Dobieranie najlepszego stylu pisania"
    },
    {
      icon: FileText,
      text: "Analizowanie grupy docelowej"
    },
    {
      icon: MessageCircle,
      text: "Tworzenie struktury wiadomości"
    },
    {
      icon: Edit,
      text: "Optymalizowanie treści"
    },
    {
      icon: Zap,
      text: "Finalizowanie emaila"
    }
  ];

  // Simulate loading progress
  useInterval(() => {
    setProgress((prev) => Math.min(prev + 5, 90));
  }, 800);
  
  // Cycle through different icons and texts
  useInterval(() => {
    setCurrentStepIndex((prev) => (prev + 1) % loadingSteps.length);
  }, 3000);
  
  const currentStep = loadingSteps[currentStepIndex];
  const IconComponent = currentStep.icon;
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[250px] py-8 bg-white rounded-xl">
      <div className="mb-6">
        <div className="flex items-center justify-center p-6 rounded-full bg-copywrite-teal bg-opacity-10 h-24 w-24">
          <IconComponent className="h-12 w-12 text-copywrite-teal animate-pulse" />
        </div>
      </div>
      
      <div className="text-center mb-6">
        <p className="text-gray-600 text-sm">{currentStep.text}</p>
      </div>
      
      <div className="w-48 mt-2">
        <Progress value={progress} className="h-2 bg-gray-100" indicatorClassName="bg-copywrite-teal" />
      </div>
    </div>
  );
};

export default LoadingState;
