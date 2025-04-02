import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface Step {
  id: number;
  title: string;
  description: string;
}

interface CaseStudy {
  id: string;
  title: string;
  subtitle: string;
  label: string;
  steps: Step[];
}

const caseStudies: CaseStudy[] = [
  {
    id: 'services',
    label: 'Usługi',
    title: 'Jak trenerka fitness w 72 godziny zdobyła 600 nowych obserwujących i wygenerowała 8 000 zł przy ROI 13x',
    subtitle: 'Tak, serio. Sprawdź jak to osiągnęła.',
    steps: [
      {
        id: 1,
        title: 'Stworzenie idealnie doprecyzowanych reklam pod generowanie obserwujących na Instagramie',
        description: 'Beata uruchomiła kampanię reklamową nastawioną na zdobywanie nowych obserwujących na Instagramie. Dzięki temu jednocześnie budowała swoją społeczność i kierowała uwagę odbiorców na swoje produkty online. Każda nowa obserwacja kosztowała średnio zaledwie 16 groszy, a kampania przynosiła nie tylko wzrost zasięgów, ale także realne sprzedaże.'
      },
      {
        id: 2,
        title: 'Optymalizacja treści na social mediach pod sprzedaż i realną wartość dla klienta',
        description: 'Beata zaczęła tworzyć posty, które nie tylko przyciągały uwagę, ale realnie odpowiadały na potrzeby jej idealnego klienta. Z pomocą Copility tworzyła treści z konkretną wartością i wezwaniem do działania, zachęcając do komentowania posta. Dzięki temu generowała średnio 300 komentarzy od potencjalnych klientów, zwiększała zasięgi i zaangażowanie, a sprzedaż działała bez potrzeby wysyłania żadnych wiadomości prywatnych.'
      },
      {
        id: 3,
        title: 'Wykorzystywanie obecnych klientów do zwiększania sprzedaży',
        description: 'Beata wykorzystała Copility do tworzenia maili sprzedażowych, które wysyłała do klientów, którzy już wcześniej kupili jej produkty. Każdy mail był dopasowany do potrzeb odbiorcy i zawierał jasną propozycję droższej usługi. Dzięki temu podejściu osiągnęła konwersję na poziomie 33%, bez nowych kampanii, po prostu sprzedając więcej tym, którzy już znali jej ofertę.'
      }
    ]
  },
  {
    id: 'ecommerce',
    label: 'Sklepy internetowe',
    title: 'Jak sklep beauty w zaledwie 7 dni zwiększył swoją sprzedaż o 27% dzięki nowej kampanii mailowej',
    subtitle: 'Tak, serio. Sprawdź jak to osiągnął.',
    steps: [
      {
        id: 1,
        title: 'Stworzenie dwóch pełnych kampanii cold mailingowych w jeden dzień',
        description: 'Sklep stworzył dwie nowe kampanie mailingowe oparte na różnych emocjach, by sprawdzić, która lepiej przemawia do jego klientów. Każda z nich miała po 14 wiadomości zaplanowanych na cały lejek. Dzięki Copility udało się stworzyć obie kampanie w jeden dzień.'
      },
      {
        id: 2,
        title: 'Skupienie się na kampanii, która osiągnęła współczynnik otwieralności na poziomie 70% i konwersję powyżej 6%',
        description: 'Po uruchomieniu testów, zespół postawił na skuteczniejszą kampanię, która osiągnęła współczynnik otwieralności na poziomie 70% i konwersję powyżej 6% wśród odbiorców. Dodatkowo prowadzono testy A/B, aby maksymalnie wykorzystać potencjał najlepszych treści.'
      },
      {
        id: 3,
        title: 'Zwiększenie zasięgów na TikToku o 42% i sprzedaży o 18% dzięki nowym treściom',
        description: 'Zespół sklepu wykorzystał Copility do stworzenia nowych skryptów reklam i treści do social mediów, opartych na tych samych przekazach, które sprawdziły się w komunikacji z klientami. Dzięki temu mogli szybko uruchomić spójne kampanie w innych kanałach, bez tracenia czasu na wymyślanie wszystkiego od zera. W ciągu 7 dni zwiększyli liczbę obserwujących na TikToku o 42%, a sprzedaż z tego kanału wzrosła o 18%.'
      }
    ]
  },
  {
    id: 'apps',
    label: 'Aplikacje on-line',
    title: 'Jak aplikacja edukacyjna zwiększyła sprzedaż o 300% i trafiła na 2. miejsce w App Store i Google Play',
    subtitle: 'Tak, serio. Sprawdź jak to osiągnęła.',
    steps: [
      {
        id: 1,
        title: 'Systematyczne tworzenie contentu na TikToka i generowanie średnio 70 tys. wyświetleń dziennie',
        description: 'Zespół aplikacji edukacyjnej postawił na systematyczną obecność na TikToku. Dzięki szybkości działania Copility byli w stanie codziennie tworzyć aż 20 organicznych postów, które łącznie generowały średnio 70 000 wyświetleń dziennie. Ta strategia pozwoliła im dynamicznie rozwijać profile w social mediach i zdobywać średnio 150 nowych użytkowników aplikacji każdego dnia, z czego aż 25% stawało się stałymi klientami.'
      },
      {
        id: 2,
        title: 'Wdrożenie reklam na TikToku i wzrost sprzedaży o 300% w 7 dni',
        description: 'Po sukcesie działań organicznych, zespół aplikacji uruchomił kampanię reklamową na TikToku. Dzięki skutecznym skryptom stworzonym z pomocą Copility, koszt jednego pobrania wynosił średnio zaledwie 70 groszy. Kampania przyniosła błyskawiczny efekt, w ciągu pierwszego tygodnia sprzedaż wzrosła aż o 300%.'
      },
      {
        id: 3,
        title: 'Skalowanie obecności w social mediach dzięki automatyzacji procesu tworzenia treści',
        description: 'Zespół aplikacji zdecydował się zautomatyzować cały proces tworzenia treści, wykorzystując Copility do generowania dziesiątek nowych skryptów każdego dnia. Dzięki temu byli w stanie codziennie publikować ponad 50 postów organicznych, co umożliwiło im niesamowite skalowanie. Ta strategia pozwoliła bić rekordy sprzedaży miesiąc po miesiącu, bez zatrudniania nowych osób ani wydłużania czasu pracy.'
      }
    ]
  }
];

const CaseStudiesSection = () => {
  const [activeTab, setActiveTab] = useState('services');

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="container px-6 mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            3 sposoby, w jakie klienci wykorzystują Copility do tworzenia skryptów, które NATYCHMIAST zwiększają sprzedaż i budują silną markę
          </h2>
          <p className="text-xl text-gray-600">
            Przykłady sukcesu dopasowane do Twojego modelu biznesowego
          </p>
        </motion.div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="w-full mb-10 grid grid-cols-3 rounded-md overflow-hidden">
            {caseStudies.map((study) => (
              <TabsTrigger 
                key={study.id} 
                value={study.id}
                className="py-4 rounded-none text-white data-[state=active]:bg-copywrite-teal data-[state=active]:text-white data-[state=inactive]:bg-gray-800 data-[state=inactive]:hover:bg-gray-700 transition-colors"
              >
                {study.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {caseStudies.map((study) => (
            <TabsContent key={study.id} value={study.id} className="mt-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-10">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    {study.title}
                  </h3>
                  <p className="text-lg text-gray-600">
                    {study.subtitle}
                  </p>
                </div>

                <div className="space-y-12">
                  {study.steps.map((step) => (
                    <div key={step.id} className="flex flex-col gap-3">
                      <div className="flex-shrink-0">
                        <div className="inline-block px-4 py-2 bg-copywrite-teal-light text-copywrite-teal font-medium rounded-md">
                          Krok {step.id}
                        </div>
                      </div>
                      <h4 className="text-xl font-semibold text-gray-900">
                        {step.title}
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default CaseStudiesSection;
