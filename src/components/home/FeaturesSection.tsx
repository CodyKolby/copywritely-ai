
import { motion } from 'framer-motion';
import { Lightbulb, Pen, Clipboard } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }) => {
  return (
    <div className="flex flex-col items-center text-center p-8 bg-white rounded-xl h-full">
      <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center mb-8">
        <Icon className="h-14 w-14 text-copywrite-teal" />
      </div>
      <h3 className="text-2xl font-bold mb-5">{title}</h3>
      <p className="text-gray-600 text-lg">{description}</p>
    </div>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      icon: Lightbulb,
      title: "Reklamy gotowe w minutę",
      description: "Copility to pierwsze w Polsce w pełni zautomatyzowane narzędzie, które tworzy skrypty reklamowe podnoszące sprzedaż i budujące markę w mniej niż minutę."
    },
    {
      icon: Pen,
      title: "Zero pisania",
      description: "Copility nie wymaga od Ciebie pisania nawet jednego zdania. Całą pracę wykonuje za Ciebie nasz autorski agent NeuroScript™"
    },
    {
      icon: Clipboard,
      title: "Prosta ścieżka",
      description: "Opisujesz swój produkt.\nCopility myśli za Ciebie.\nTwój skrypt jest gotowy.\nKlikasz. Publikujesz. Sprzedajesz."
    }
  ];

  return (
    <section className="py-32 px-6 bg-white text-gray-900">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            Dlaczego coraz więcej osób decyduje się na Copility?
          </h2>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-12"
        >
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
