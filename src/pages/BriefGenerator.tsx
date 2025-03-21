import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import BriefCard, { Brief } from '@/components/BriefCard';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormControl, FormDescription } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

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

const adObjectives = [
  {
    id: 'website_visits',
    title: 'Zwiększenie liczby odwiedzin na stronie internetowej'
  },
  {
    id: 'digital_product',
    title: 'Sprzedaż produktu cyfrowego'
  },
  {
    id: 'sales_call',
    title: 'Umówienie rozmowy sprzedażowej'
  },
  {
    id: 'event_signup',
    title: 'Zapisanie się na wydarzenie lub listę mailingową'
  }
];

const formSchema = z.object({
  generationType: z.enum(['ai', 'guided']),
  guidanceText: z.string().optional(),
});

const adObjectiveSchema = z.object({
  objective: z.string()
});

type FormValues = z.infer<typeof formSchema>;
type AdObjectiveFormValues = z.infer<typeof adObjectiveSchema>;

const BriefGenerator = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generatedBrief, setGeneratedBrief] = useState<Brief | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adObjectiveDialogOpen, setAdObjectiveDialogOpen] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState<string>('');
  const [selectedGenerationType, setSelectedGenerationType] = useState<'ai' | 'guided'>('ai');
  const [guidanceText, setGuidanceText] = useState<string>('');
  const [selectedAdObjective, setSelectedAdObjective] = useState<string>('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      generationType: 'ai',
      guidanceText: '',
    },
  });

  const adObjectiveForm = useForm<AdObjectiveFormValues>({
    resolver: zodResolver(adObjectiveSchema),
    defaultValues: {
      objective: '',
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const openGenerationDialog = (templateId: string) => {
    setCurrentTemplateId(templateId);
    setDialogOpen(true);
  };

  const handleAdObjectiveSubmit = (values: AdObjectiveFormValues) => {
    setSelectedAdObjective(values.objective);
    setAdObjectiveDialogOpen(false);
    
    generateBriefWithObjective(currentTemplateId, selectedGenerationType, guidanceText, values.objective);
  };

  const generateBrief = (templateId: string, values: FormValues) => {
    setSelectedGenerationType(values.generationType);
    setGuidanceText(values.guidanceText || '');
    setDialogOpen(false);
    
    if (templateId === 'ad') {
      setAdObjectiveDialogOpen(true);
    } else {
      setIsLoading(true);
      setSelectedTemplate(templateId);
      setGeneratedBrief(null);
      
      console.log('Generation type:', values.generationType);
      if (values.generationType === 'guided' && values.guidanceText) {
        console.log('User guidance:', values.guidanceText);
      }
      
      setTimeout(() => {
        setGeneratedBrief(sampleBriefs[templateId]);
        setIsLoading(false);
        toast.success('Brief generated successfully!');
      }, 1500);
    }
  };

  const generateBriefWithObjective = (templateId: string, generationType: 'ai' | 'guided', guidance: string, objective: string) => {
    setIsLoading(true);
    setSelectedTemplate(templateId);
    setGeneratedBrief(null);
    
    console.log('Generation type:', generationType);
    console.log('Ad objective:', objective);
    if (generationType === 'guided' && guidance) {
      console.log('User guidance:', guidance);
    }
    
    setTimeout(() => {
      const objectiveTitle = adObjectives.find(obj => obj.id === objective)?.title || objective;
      
      const modifiedBrief = {
        ...sampleBriefs[templateId],
        objective: objectiveTitle,
      };
      
      setGeneratedBrief(modifiedBrief);
      setIsLoading(false);
      toast.success('Brief generated successfully!');
    }, 1500);
  };

  const resetBrief = () => {
    setSelectedTemplate(null);
    setGeneratedBrief(null);
    setSelectedAdObjective('');
  };

  const onSubmit = (values: FormValues) => {
    generateBrief(currentTemplateId, values);
  };

  const watchGenerationType = form.watch('generationType');

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
                  onClick={() => openGenerationDialog(template.id)}
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>How would you like to generate your brief?</DialogTitle>
              <DialogDescription>
                Choose between a fully AI-generated brief or provide guidance on what you'd like to include.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="generationType"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ai" id="ai" />
                          <Label htmlFor="ai" className="font-medium">Fully AI-generated</Label>
                        </div>
                        <FormDescription className="ml-6">
                          AI will generate a complete brief based on the selected template.
                        </FormDescription>
                        
                        <div className="flex items-center space-x-2 mt-4">
                          <RadioGroupItem value="guided" id="guided" />
                          <Label htmlFor="guided" className="font-medium">User-guided generation</Label>
                        </div>
                        <FormDescription className="ml-6">
                          Provide specific details about your target audience, product, or campaign goals.
                        </FormDescription>
                      </RadioGroup>
                    </FormItem>
                  )}
                />
                
                {watchGenerationType === 'guided' && (
                  <FormField
                    control={form.control}
                    name="guidanceText"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="guidanceText">Describe what you need</Label>
                        <FormControl>
                          <Textarea
                            id="guidanceText"
                            placeholder="Example: I need a brief for a fitness business targeting women over 30..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Be specific about your audience, product details, or any particular messages you want to include.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                )}
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-copywrite-teal hover:bg-copywrite-teal-dark transition-colors">
                    Generate Brief
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={adObjectiveDialogOpen} onOpenChange={setAdObjectiveDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Jaki cel reklama ma mieć?</DialogTitle>
              <DialogDescription>
                Wybierz cel kampanii reklamowej.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...adObjectiveForm}>
              <form onSubmit={adObjectiveForm.handleSubmit(handleAdObjectiveSubmit)} className="space-y-6">
                <FormField
                  control={adObjectiveForm.control}
                  name="objective"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="gap-3"
                      >
                        {adObjectives.map((objective) => (
                          <div key={objective.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={objective.id} id={objective.id} />
                            <Label htmlFor={objective.id} className="font-medium">{objective.title}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAdObjectiveDialogOpen(false)}
                  >
                    Anuluj
                  </Button>
                  <Button type="submit" className="bg-copywrite-teal hover:bg-copywrite-teal-dark transition-colors">
                    Dalej
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BriefGenerator;
