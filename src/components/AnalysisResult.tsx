
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface AnalysisScore {
  category: string;
  score: number;
  feedback: string;
}

interface AnalysisResultProps {
  scores: AnalysisScore[];
  overallScore: number;
  feedback: string;
  className?: string;
}

const AnalysisResult = ({ scores, overallScore, feedback, className }: AnalysisResultProps) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'bg-white border border-gray-200 rounded-xl shadow-soft overflow-hidden',
        className
      )}
    >
      <div className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-6 border-b border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2 sm:mb-0">Analysis Results</h2>
          <div className="flex items-center">
            <span className="text-gray-700 mr-2">Overall Score:</span>
            <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}/10
            </span>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Feedback Summary</h3>
          <p className="text-gray-700 leading-relaxed">{feedback}</p>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Category Scores</h3>
          <div className="space-y-4">
            {scores.map((item) => (
              <div 
                key={item.category}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div 
                  onClick={() => toggleCategory(item.category)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <h4 className="font-medium text-gray-900">{item.category}</h4>
                  <div className="flex items-center">
                    <span className={`font-semibold ${getScoreColor(item.score)}`}>
                      {item.score}/10
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 ml-2 text-gray-500 transition-transform ${
                        expandedCategory === item.category ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                
                {expandedCategory === item.category && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-4 pb-4 text-gray-700 border-t border-gray-100"
                  >
                    <p className="py-2">{item.feedback}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnalysisResult;
