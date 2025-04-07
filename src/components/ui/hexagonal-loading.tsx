
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInterval } from '@/hooks/use-interval';
import { Progress } from '@/components/ui/progress';
import { 
  Type, 
  Wand2, 
  Search, 
  LayoutTemplate, 
  Tags 
} from 'lucide-react';

// Define the loading texts and their corresponding icons
const loadingSteps = [
  {
    text: 'Tworzenie chwytliwych nagłówków',
    icon: Type,
    color: '#4c6ef5'
  },
  {
    text: 'Dobieranie najlepszego stylu pisania',
    icon: Wand2,
    color: '#fa5252'
  },
  {
    text: 'Analizowanie Twojej branży',
    icon: Search,
    color: '#12b886'
  },
  {
    text: 'Układanie idealnej struktury tekstu',
    icon: LayoutTemplate,
    color: '#fd7e14'
  },
  {
    text: 'Dopasowywanie słów, które sprzedają',
    icon: Tags,
    color: '#7950f2'
  }
];

interface HexagonalLoadingProps {
  progress?: number;
}

export const HexagonalLoading: React.FC<HexagonalLoadingProps> = ({ 
  progress = 0
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [animateIcon, setAnimateIcon] = useState(true);

  // Change the loading step every 3 seconds
  useInterval(() => {
    setAnimateIcon(false);
    setTimeout(() => {
      setCurrentStepIndex((prevIndex) => (prevIndex + 1) % loadingSteps.length);
      setAnimateIcon(true);
    }, 300);
  }, 3000);

  const currentStep = loadingSteps[currentStepIndex];
  const Icon = currentStep.icon;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-6 bg-white rounded-xl">
      {/* Hexagon container */}
      <div className="relative mb-8">
        <div className="flex justify-center">
          {/* Main large hexagon */}
          <motion.div 
            className="relative flex items-center justify-center z-20"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="hexagon bg-white shadow-lg border-2 border-copywrite-teal flex items-center justify-center">
              <motion.div
                key={currentStepIndex}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: animateIcon ? 1 : 0, opacity: animateIcon ? 1 : 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center"
              >
                <Icon size={36} color={currentStep.color} strokeWidth={1.5} />
              </motion.div>
            </div>
          </motion.div>

          {/* Background hexagons */}
          <div className="hexagon-grid">
            {[...Array(6)].map((_, index) => (
              <motion.div
                key={`hex-${index}`}
                className="hex-background bg-gray-50 border border-copywrite-teal"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
                style={{
                  position: 'absolute',
                  transform: `rotate(${60 * index}deg) translate(80px) rotate(${-60 * index}deg)`
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Text and progress indicator */}
      <motion.div 
        key={`text-${currentStepIndex}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="text-center mb-6"
      >
        <h3 className="text-lg font-medium text-gray-700">{currentStep.text}</h3>
      </motion.div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Using CSS in JSX without the jsx attribute */}
      <style>
        {`
        .hexagon {
          width: 120px;
          height: calc(120px * 0.866);
          background-color: #fff;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 20;
        }
        
        .hexagon:before,
        .hexagon:after,
        .hex-background:before,
        .hex-background:after {
          content: '';
          position: absolute;
          width: 0;
          height: 0;
          border-style: solid;
        }
        
        .hexagon:before,
        .hex-background:before {
          top: -30px;
          border-width: 0 60px 30px 60px;
          border-color: transparent transparent #fff transparent;
        }
        
        .hexagon:after,
        .hex-background:after {
          bottom: -30px;
          border-width: 30px 60px 0 60px;
          border-color: #fff transparent transparent transparent;
        }
        
        .hex-background {
          width: 60px;
          height: calc(60px * 0.866);
          background-color: #f8f9fa;
          position: absolute;
          z-index: 10;
        }
        
        .hex-background:before {
          top: -15px;
          border-width: 0 30px 15px 30px;
          border-color: transparent transparent #f8f9fa transparent;
        }
        
        .hex-background:after {
          bottom: -15px;
          border-width: 15px 30px 0 30px;
          border-color: #f8f9fa transparent transparent transparent;
        }
        
        .hexagon-grid {
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        /* Add green border to hexagon before/after */
        .hexagon:before {
          border-color: transparent transparent #fff transparent;
        }
        
        .hexagon:after {
          border-color: #fff transparent transparent transparent;
        }

        /* Adding border for hexagon before and after pseudo elements */
        .hexagon::before {
          top: -30px;
          border-width: 0 60px 30px 60px;
          border-color: transparent transparent #10b981 transparent;
          z-index: -1;
        }
        
        .hexagon::after {
          bottom: -30px;
          border-width: 30px 60px 0 60px;
          border-color: #10b981 transparent transparent transparent;
          z-index: -1;
        }

        /* Small hexagon borders */
        .hex-background::before {
          border-color: transparent transparent #10b981 transparent;
        }
        
        .hex-background::after {
          border-color: #10b981 transparent transparent transparent;
        }
        `}
      </style>
    </div>
  );
};

export default HexagonalLoading;
