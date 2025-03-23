
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useParams, useNavigate } from 'react-router-dom';
import TextEditor from '@/components/TextEditor';
import AnalysisResult, { AnalysisScore } from '@/components/AnalysisResult';
import { Skeleton } from '@/components/ui/skeleton';
import BriefCard from '@/components/BriefCard';
import { CheckCheck, AlertCircle, FileText, Brain, MessageSquare, PenTool } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Sample brief for demo purposes
const sampleBrief = {
  title: "Eco-Friendly Water Bottle Campaign",
  objective: "Create compelling ad copy for a new line of sustainable water bottles that highlights their eco-friendly features and appeals to environmentally conscious consumers.",
  audience: "Environmentally conscious individuals, ages 18-35, who are interested in reducing plastic waste and making sustainable purchasing decisions.",
  keyMessages: [
    "Made from sustainable materials that reduce environmental impact",
    "Sleek and modern design that fits with active lifestyles",
    "Portion of proceeds donated to ocean cleanup initiatives",
    "Limited time 20% discount with promo code ECO20"
  ],
  callToAction: "Visit our website to purchase with promo code ECO20 for 20% off your first order.",
  additionalInfo: [
    "Word count should be approximately 150-200 words",
    "Tone should be inspiring and positive, but not preachy",
    "Include the promo code in a natural way",
    "Emphasize both environmental benefits and product quality"
  ]
};

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

// Analysis steps for animation
const analysisSteps = [
  { icon: FileText, text: "Analyzing text structure and clarity..." },
  { icon: MessageSquare, text: "Evaluating messaging and key points..." },
  { icon: PenTool, text: "Checking tone and style..." },
  { icon: Brain, text: "Assessing persuasiveness and impact..." },
  { icon: AlertCircle, text: "Reviewing alignment with brief..." },
  { icon: CheckCheck, text: "Finalizing analysis..." }
];

const CopyEditor = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submittedCopy, setSubmittedCopy] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    scores: AnalysisScore[];
    overallScore: number;
    feedback: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [projectTitle, setProjectTitle] = useState<string>("New Copy");

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load project title if projectId is provided
  useEffect(() => {
    const loadProjectTitle = async () => {
      if (projectId && user) {
        try {
          const { data, error } = await supabase
            .from('projects')
            .select('title')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single();
          
          if (error) {
            console.error('Error loading project title:', error);
            return;
          }
          
          if (data && data.title) {
            setProjectTitle(data.title);
          }
        } catch (error) {
          console.error('Error loading project title:', error);
        }
      }
    };

    loadProjectTitle();
  }, [projectId, user]);

  // Effect to handle the analysis steps animation
  useEffect(() => {
    let interval: number;
    
    if (isAnalyzing && currentStep < analysisSteps.length - 1) {
      interval = window.setInterval(() => {
        setCurrentStep(prev => prev + 1);
      }, 1200);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAnalyzing, currentStep]);

  const handleSubmit = (text: string) => {
    setSubmittedCopy(text);
    setAnalysis(null);
    setIsAnalyzing(true);
    setCurrentStep(0);
    
    // Scroll to analysis section
    setTimeout(() => {
      document.getElementById('analysis-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setAnalysis(sampleAnalysis);
      setIsAnalyzing(false);
      toast.success('Analysis complete!');
    }, 7500); // Longer timeout to allow for step animations
  };

  const resetEditor = () => {
    // Navigate to copy editor without projectId parameter
    navigate('/copy-editor');
    setSubmittedCopy(null);
    setAnalysis(null);
    setIsAnalyzing(false);
    setCurrentStep(0);
    setProjectTitle("New Copy");
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
              placeholder="Write your advertising copy here based on the brief..."
              maxLength={500}
              projectId={projectId}
              projectTitle={projectTitle}
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
          
          <div id="analysis-section">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {!submittedCopy ? "Brief Information" : "Analysis Results"}
            </h2>
            
            {!submittedCopy && !isAnalyzing && (
              <BriefCard brief={sampleBrief} className="h-full" />
            )}
            
            {isAnalyzing && (
              <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100 h-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Analyzing Your Copy...</h3>
                
                <div className="space-y-5">
                  {analysisSteps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index <= currentStep;
                    const isCompleted = index < currentStep;
                    
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ 
                          opacity: isActive ? 1 : 0.4, 
                          y: 0 
                        }}
                        transition={{ duration: 0.5 }}
                        className={`flex items-center ${isActive ? '' : 'opacity-40'}`}
                      >
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full mr-4 ${
                          isCompleted ? 'bg-green-100 text-green-600' : 'bg-copywrite-teal-light text-copywrite-teal'
                        }`}>
                          <StepIcon size={20} />
                        </div>
                        <span className="text-gray-700">{step.text}</span>
                        {isCompleted && (
                          <CheckCheck className="ml-auto text-green-600" size={18} />
                        )}
                      </motion.div>
                    );
                  })}
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
            <li>Review the brief details provided on the right side of the screen.</li>
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
