
import { BriefTemplate } from '@/components/briefs/BriefTemplateGrid';
import { Brief } from '@/components/BriefCard';

// Brief templates for the template grid
export const briefTemplates: BriefTemplate[] = [
  {
    id: 'product',
    title: 'Brief produktowy',
    description: 'Stwórz brief do reklamy produktu lub usługi'
  },
  {
    id: 'ad',
    title: 'Brief reklamowy',
    description: 'Stwórz brief do kampanii reklamowej'
  },
  {
    id: 'landing',
    title: 'Brief landing page',
    description: 'Stwórz brief do landing page',
    comingSoon: true
  },
  {
    id: 'content',
    title: 'Brief content',
    description: 'Stwórz brief do treści marketingowych'
  }
];

// Sample generated briefs for demonstration
export const sampleBriefs: Record<string, Brief> = {
  product: {
    title: 'Nowy innowacyjny smartwatch - seria X',
    objective: 'Przedstawienie klientom nowej serii smartwatchy z funkcjami zdrowotnymi',
    audience: 'Osoby aktywne fizycznie, zainteresowane monitorowaniem zdrowia, w wieku 25-45 lat',
    keyMessages: [
      'Najdokładniejsze pomiary tętna i saturacji w swojej klasie',
      'Do 7 dni pracy na jednym ładowaniu',
      'Automatyczne wykrywanie 12 różnych aktywności fizycznych',
      'Wodoodporność do 50m głębokości'
    ],
    callToAction: 'Zamów przedpremierowo z rabatem 15%',
    additionalInfo: [
      'Dostępny w trzech kolorach: czarnym, srebrnym i złotym',
      'Możliwość personalizacji tarczy zegarka',
      'Kompatybilny z iOS i Android',
      'Darmowa dostawa przy zamówieniu do 31 maja'
    ]
  },
  ad: {
    title: 'Kampania letnia zdrowych przekąsek "NaturalBite"',
    objective: 'Zwiększenie świadomości marki i sprzedaży zdrowych przekąsek w okresie letnim',
    audience: 'Rodzice dzieci w wieku szkolnym, osoby dbające o zdrowy styl życia, w wieku 28-45 lat',
    keyMessages: [
      'Przekąski bez cukru dodanego, konserwantów i barwników',
      'Idealne do szkoły, pracy i na wycieczkę',
      'Wysoka zawartość błonnika i białka',
      'Smakują świetnie i są zdrowe'
    ],
    callToAction: 'Spróbuj naszych przekąsek z rabatem 20% na pierwszy zakup',
    additionalInfo: [
      'Promocja obowiązuje do końca sierpnia',
      'Dostępne w 3 wariantach smakowych',
      'Opakowania przyjazne dla środowiska',
      'Część dochodu przekazujemy na organizacje ekologiczne'
    ]
  },
  content: {
    title: 'Seria artykułów "Inteligentny dom dla każdego"',
    objective: 'Edukacja klientów o rozwiązaniach smart home i zwiększenie sprzedaży podstawowych produktów',
    audience: 'Osoby zainteresowane technologią, właściciele domów i mieszkań, w wieku 30-55 lat',
    keyMessages: [
      'Smart home nie musi być drogi - zacznij od małych kroków',
      'Oszczędność energii dzięki inteligentnym termostatom i oświetleniu',
      'Zwiększone bezpieczeństwo dzięki prostym systemom monitoringu',
      'Kompatybilność z popularnymi asystentami głosowymi'
    ],
    callToAction: 'Pobierz darmowy przewodnik "Smart Home Starter Pack"',
    additionalInfo: [
      'Seria 5 artykułów publikowanych co tydzień',
      'Format: tekst + infografiki + krótkie wideo',
      'Dystrybucja: blog firmowy, newsletter, social media',
      'Dodatkowe webinar dla zapisanych użytkowników'
    ]
  }
};
