
export interface ScriptTemplate {
  id: string;
  title: string;
  description: string;
  comingSoon?: boolean;
}

export const scriptTemplates: ScriptTemplate[] = [
  { 
    id: 'email',
    title: 'Marketing Email',
    description: 'Create persuasive email script to promote products or services.'
  },
  { 
    id: 'social',
    title: 'Social Media Post',
    description: 'Craft engaging script optimized for social media platforms.'
  },
  { 
    id: 'landing',
    title: 'Landing Page',
    description: 'Wkrótce dostępne - Create compelling script for conversion-focused landing pages.',
    comingSoon: true
  },
  { 
    id: 'ad',
    title: 'Digital Advertisement',
    description: 'Write attention-grabbing script for digital marketing campaigns.'
  }
];
