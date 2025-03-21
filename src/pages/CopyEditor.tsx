
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import TextEditor from '@/components/TextEditor';
import AnalysisResult, { AnalysisScore } from '@/components/AnalysisResult';
import { Skeleton } from '@/components/ui/skeleton';

// Sample analysis for demo purposes
const sampleAnalysis = {
  scores: [
    {
      category: 'Clarity & Messaging',
      score: 8,
      feedback: 'Your copy effectively communicates the key messages outlined in the brief. The eco-friendly aspects of the product are highlighted well, and the sleek design is mentioned clearly. Consider making the sustainable materials more specific (e.g., "made from recycled ocean plastic" instead of just "sustainable materials").'
    },
    {
      category: 'Audience Targeting',
      score: 7,
      feedback: 'The tone and language generally align with the environmentally conscious 18-35 age demographic. To improve, consider incorporating more specific language that resonates with this audience, such as references to sustainability movements or environmental impact statistics that would appeal to their values.'
    },
    {
      category: 'Persuasiveness',
      score: 9,
      feedback: 'Excellent use of persuasive techniques. The limited-time discount creates urgency, and the benefits of the product are presented in a compelling way. The emotional appeal to environmental responsibility is particularly effective.'
    },
    {
      category: 'Call to Action',
      score: 8,
      feedback: 'The CTA is clear and includes the promo code as required. To strengthen it further, consider adding a specific benefit to taking action (e.g., "Use promo code ECO20 at checkout to save 20% and start reducing plastic waste today").'
    },
    {
      category: 'Brevity & Structure',
      score: 6,
      feedback: 'The copy is slightly longer than the 200-word limit specified in the brief. Consider tightening some sentences and removing redundant information. The structure is good with clear paragraphs, but some sentences could be shortened for better readability.'
    }
  ],
  overallScore: 7.6,
  feedback: 'Overall, your copy effectively addresses the brief requirements and communicates the key selling points of the eco-friendly water bottle. The tone is engaging and appropriate for the target audience. To improve, focus on being more concise while maintaining the key messaging, and add more specific details about the sustainable materials used in the product. The call to action is clear but could be strengthened with additional benefits.'
};

const CopyEditor = () => {
  const [submittedCopy, setSubmittedCopy] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    scores: AnalysisScore[];
    overallScore: number;
    feedback: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (text: string) => {
    setSubmittedCopy(text);
    setAnalysis(null);
    setIsAnalyzing(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setAnalysis(sampleAnalysis);
      setIsAnalyzing(false);
      toast.success('Analysis complete!');
    }, 2000);
  };

  const resetEditor = () => {
    setSubmittedCopy(null);
    setAnalysis(null);
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Copy Editor & Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Write your copy based on a brief and get instant AI feedback to improve your skills.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Write Your Copy</h2>
            <TextEditor 
              onSubmit={handleSubmit} 
              placeholder="Write your advertising copy here based on a brief..."
              maxLength={500}
            />
            
            {submittedCopy && (
              <div className="mt-6">
                <button
                  onClick={resetEditor}
                  className="text-copywrite-teal hover:text-copywrite-teal-dark underline text-sm"
                >
                  Reset and write new copy
                </button>
              </div>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Results</h2>
            
            {!submittedCopy && !isAnalyzing && (
              <div className="bg-gray-50 rounded-xl p-6 h-full flex items-center justify-center">
                <p className="text-gray-500 text-center">
                  Submit your copy to receive AI analysis and feedback.
                </p>
              </div>
            )}
            
            {isAnalyzing && (
              <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
                <Skeleton className="h-8 w-3/4 mb-6" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-11/12 mb-2" />
                <Skeleton className="h-4 w-10/12 mb-6" />
                
                <Skeleton className="h-6 w-1/3 mb-4" />
                
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <Skeleton className="h-5 w-1/3" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      {i === 1 && (
                        <>
                          <Skeleton className="h-3 w-full mb-1" />
                          <Skeleton className="h-3 w-11/12 mb-1" />
                          <Skeleton className="h-3 w-10/12" />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {submittedCopy && analysis && !isAnalyzing && (
              <AnalysisResult 
                scores={analysis.scores}
                overallScore={analysis.overallScore}
                feedback={analysis.feedback}
              />
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-50 rounded-xl p-6 md:p-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How to use this tool</h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700">
            <li>First, generate a brief in the Brief Generator section to understand what to write about.</li>
            <li>Write your copy in the editor based on the brief requirements.</li>
            <li>Submit your copy to receive AI analysis on various aspects like clarity, persuasiveness, and audience targeting.</li>
            <li>Review your feedback and scores to identify areas for improvement.</li>
            <li>Revise your copy based on the feedback and submit again to see if your score improves.</li>
          </ol>
        </motion.div>
      </div>
    </div>
  );
};

export default CopyEditor;
