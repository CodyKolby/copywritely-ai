
export interface ScriptTemplate {
  id: string;
  title: string;
  description: string;
  comingSoon?: boolean;
}

export const scriptTemplates: ScriptTemplate[] = [
  { 
    id: 'email',
    title: 'Email sprzedażowy',
    description: 'Wygeneruj skuteczny e-mail, który sprzedaje Twój produkt lub usługę bez nachalnego tonu.'
  },
  { 
    id: 'social',
    title: 'Post na social media',
    description: 'Stwórz angażujący post dopasowany do Twojej grupy odbiorców, który przekona ich do Ciebie lub Twojego produktu.'
  },
  { 
    id: 'landing',
    title: 'Strona internetowa',
    description: 'Wygeneruj tekst, który skutecznie konwertuje odwiedzających Twoją strone w płacących klientów.',
    comingSoon: true
  },
  { 
    id: 'ad',
    title: 'Reklama internetowa',
    description: 'Wygeneruj skrypt, który przyciąga uwagę i zwiększa skuteczność Twoich reklam nawet o 30%.'
  }
];
