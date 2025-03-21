
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import BriefCard, { Brief } from '@/components/BriefCard';

// Sample data for demo purposes
const sampleBriefTemplates = [
  { 
    id: 'email',
    title: 'Marketing Email',
    description: 'Create persuasive email copy to promote products or services.'
  },
  { 
    id: 'social',
    title: 'Social Media Post',
    description: 'Craft engaging posts optimized for social media platforms.'
  },
  { 
    id: 'landing',
    title: 'Landing Page',
    description: 'Design compelling copy for conversion-focused landing pages.'
  },
  { 
    id: 'ad',
    title: 'Digital Advertisement',
    description: 'Write attention-grabbing ads for digital marketing campaigns.'
  }
];

// Sample briefs for demo purposes
const sampleBriefs: Record<string, Brief> = {
  email: {
    title: 'Marketing Email Brief',
    objective: 'Create a marketing email to promote our new eco-friendly water bottle.',
    audience: 'Environmentally conscious consumers, ages 18-35.',
    keyMessages: [
      'Highlight the sustainable materials used.',
      'Mention its sleek design and practicality.',
      'Include a limited-time discount offer of 20%.'
    ],
    callToAction: 'Encourage recipients to visit our website and use promo code ECO20 at checkout.',
    additionalInfo: [
      'Include a product image.',
      'Keep the email under 200 words.',
      'Use a friendly and engaging tone.'
    ]
  },
  social: {
    title: 'Social Media Post Brief',
    objective: 'Create an Instagram post announcing our summer collection sale.',
    audience: 'Fashion-forward young adults, ages 20-30.',
    keyMessages: [
      'Announce 40% off all summer collection items',
      'Emphasize limited availability (one week only)',
      'Highlight that this includes new arrivals'
    ],
    callToAction: 'Direct followers to the link in bio to shop the sale.',
    additionalInfo: [
      'Use trendy, upbeat language',
      'Keep it concise (under 100 characters ideal)',
      'Include relevant seasonal hashtags'
    ]
  },
  landing: {
    title: 'Landing Page Brief',
    objective: 'Create copy for a landing page that promotes our new fitness app subscription.',
    audience: 'Health-conscious individuals looking to improve their fitness routine, ages 25-45.',
    keyMessages: [
      'Emphasize the personalized workout plans feature',
      'Highlight the nutrition tracking capabilities',
      'Mention the community support aspect'
    ],
    callToAction: 'Encourage visitors to sign up for a 14-day free trial.',
    additionalInfo: [
      'Use motivational language that inspires action',
      'Include testimonials from current users',
      'Address common fitness pain points and how the app solves them'
    ]
  },
  ad: {
    title: 'Digital Advertisement Brief',
    objective: 'Create a Google Ads campaign to promote our premium coffee subscription service.',
    audience: 'Coffee enthusiasts and busy professionals, ages 28-50.',
    keyMessages: [
      'Highlight our ethically sourced, specialty-grade beans',
      'Emphasize the convenience of regular home delivery',
      'Mention the customization options (grind size, roast preferences)'
    ],
    callToAction: 'Encourage clicks with a first month 50% off offer.',
    additionalInfo: [
      'Use compelling headlines within character limits',
      'Focus on quality and convenience as selling points',
      'Include pricing information where possible'
    ]
  }
};

const BriefGenerator = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generatedBrief, setGeneratedBrief] = useState<Brief | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const generateBrief = (templateId: string) => {
    // In a real application, this would call an API to generate the brief
    setIsLoading(true);
    setSelectedTemplate(templateId);
    setGeneratedBrief(null);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setGeneratedBrief(sampleBriefs[templateId]);
      setIsLoading(false);
      toast.success('Brief generated successfully!');
    }, 1500);
  };

  const resetBrief = () => {
    setSelectedTemplate(null);
    setGeneratedBrief(null);
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
            AI Brief Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Generate creative briefs for your copywriting practice. Select a template to get started.
          </p>
        </motion.div>

        {!selectedTemplate ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {sampleBriefTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-soft border border-gray-100 flex flex-col"
              >
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{template.title}</h3>
                <p className="text-gray-600 mb-6 flex-grow">{template.description}</p>
                <Button 
                  onClick={() => generateBrief(template.id)}
                  className="w-full bg-copywrite-teal hover:bg-copywrite-teal-dark transition-colors"
                >
                  Generate Brief
                </Button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="mb-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900">
                Your Generated Brief
              </h2>
              <Button
                variant="outline"
                onClick={resetBrief}
                className="border-copywrite-teal text-copywrite-teal hover:bg-copywrite-teal/5"
              >
                Generate New Brief
              </Button>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-xl overflow-hidden shadow-soft border border-gray-100">
                <div className="p-6 md:p-8">
                  <Skeleton className="h-8 w-2/3 mb-6" />
                  
                  <div className="mb-6">
                    <Skeleton className="h-6 w-1/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  
                  <div className="mb-6">
                    <Skeleton className="h-6 w-1/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  
                  <div className="mb-6">
                    <Skeleton className="h-6 w-1/4 mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-4/5 mb-1" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  
                  <div className="mb-6">
                    <Skeleton className="h-6 w-1/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  
                  <div>
                    <Skeleton className="h-6 w-1/4 mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-1" />
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </div>
            ) : (
              generatedBrief && <BriefCard brief={generatedBrief} />
            )}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-50 rounded-xl p-6 md:p-8 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What to do next?</h2>
          <p className="text-gray-700 mb-4">
            Use this brief as a guideline to practice your copywriting skills. Once you've 
            written your copy based on this brief, head over to the Copy Editor to submit it 
            for AI analysis and feedback.
          </p>
          <Button 
            onClick={() => window.location.href = '/copy-editor'} 
            className="bg-copywrite-teal hover:bg-copywrite-teal-dark transition-colors"
          >
            Go to Copy Editor
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default BriefGenerator;
