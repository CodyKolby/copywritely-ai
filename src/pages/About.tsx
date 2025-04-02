
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { Star, ShieldCheck, Handshake, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const About = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-16 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Dlaczego stworzyliśmy Copility?
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-xl p-8 shadow-soft mb-12"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Nasza misja</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            Naszą misją jest uproszczenie i przyspieszenie procesu tworzenia skutecznych treści marketingowych, tak, aby każdy przedsiębiorca, twórca czy ekspert mógł dotrzeć do swojej grupy odbiorców i przekonać ich do działania, niezależnie od poziomu doświadczenia.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Wierzymy, że osoby, które już kroczą własną drogą, albo dopiero planują to zrobić – powinny mieć możliwość osiągania niesamowitych wyników bez konieczności inwestowania dziesiątek tysięcy złotych w agencje czy drogie kursy. Copility daje dostęp do narzędzi, które wcześniej były zarezerwowane tylko dla największych graczy.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-xl p-8 shadow-soft mb-12"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Nasze wartości</h2>
          
          <div className="space-y-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-copywrite-teal-light rounded-full p-3 mr-4">
                <Star className="h-6 w-6 text-copywrite-teal" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Skuteczność ponad wszystko</h3>
                <p className="text-gray-700">
                  Nie tworzymy po to, żeby tylko "coś było". Każdy skrypt generowany przez Copility ma jeden cel, DZIAŁAĆ. Ma przynosić efekty, budować markę i generować sprzedaż. Nie uznajemy przeciętności, dążymy do bycia najlepszym narzędziem na rynku.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-copywrite-teal-light rounded-full p-3 mr-4">
                <ShieldCheck className="h-6 w-6 text-copywrite-teal" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Prostota i dostępność</h3>
                <p className="text-gray-700">
                  Nie musisz być ekspertem, marketerem ani copywriterem, żeby tworzyć skuteczne treści. Copility upraszcza złożony świat marketingu tak, aby każdy mógł z niego korzystać, niezależnie od doświadczenia.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-copywrite-teal-light rounded-full p-3 mr-4">
                <Handshake className="h-6 w-6 text-copywrite-teal" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Wsparcie i partnerstwo</h3>
                <p className="text-gray-700">
                  Nie jesteś sam. Copility to nie tylko narzędzie, to partner w Twoim biznesie. Masz pytania? Masz problem? Jesteśmy tu, by pomóc. Twoje cele są naszymi celami.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 bg-copywrite-teal-light rounded-full p-3 mr-4">
                <Target className="h-6 w-6 text-copywrite-teal" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Prawdziwa personalizacja</h3>
                <p className="text-gray-700">
                  Twoja marka to nie kopia innych. Dlatego Copility tworzy treści, które pasują do Twojego tonu komunikacji, wartości i stylu działania. Zero szablonowości, maksimum dopasowania.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 bg-copywrite-teal-light rounded-full p-3 mr-4">
                <Sparkles className="h-6 w-6 text-copywrite-teal" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Innowacyjność</h3>
                <p className="text-gray-700">
                  Marketing zmienia się z dnia na dzień. Dlatego nieustannie analizujemy, testujemy i wdrażamy to, co faktycznie działa teraz. Copility to narzędzie, które ewoluuje razem z rynkiem, by Twoje treści zawsze były o krok przed konkurencją.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white rounded-xl p-8 shadow-soft"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Nasza wizja</h2>
          
          <p className="text-gray-700 leading-relaxed mb-6">
            Chcemy, aby każda osoba w Polsce, a w przyszłości na całym świecie, miała dostęp do najskuteczniejszego narzędzia do automatycznego tworzenia skryptów marketingowych.
          </p>
          
          <p className="text-gray-700 leading-relaxed mb-6">
            Naszą wizją jest świat, w którym każdy, kto ma pomysł, pasję lub wizję na swój produkt, nie musi obawiać się, że brak wiedzy marketingowej czy ograniczony budżet go powstrzyma.
          </p>
          
          <p className="text-gray-700 leading-relaxed mb-6">
            Chcemy dać ludziom siłę do działania, by mogli bez strachu wprowadzać swoje projekty na rynek, promować je skutecznie i osiągać to, o czym marzą.
          </p>
          
          <p className="text-gray-700 leading-relaxed">
            Jednocześnie chcemy wspierać tych, którzy już są w drodze, mają swoje produkty, usługi czy firmy i szukają sposobów na skalowanie. Copility ma być narzędziem, które pozwala nie tylko zacząć, ale też stale rosnąć i osiągać coraz ambitniejsze cele.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
