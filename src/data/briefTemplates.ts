
import { Brief } from '@/components/BriefCard';
import { BriefTemplate } from '@/components/briefs/BriefTemplateGrid';

export const sampleBriefTemplates: BriefTemplate[] = [
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
    description: 'Wkrótce dostępne - Create compelling copy for conversion-focused landing pages.',
    comingSoon: true
  },
  { 
    id: 'ad',
    title: 'Digital Advertisement',
    description: 'Write attention-grabbing ads for digital marketing campaigns.'
  }
];

export const sampleBriefs: Record<string, Brief> = {
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
