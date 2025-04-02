
import { useEffect } from 'react';
import { motion } from 'framer-motion';

const TermsOfService = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="pt-24 pb-16 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Regulamin Korzystania z Serwisu Copility</h1>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Informacje ogólne</h2>
          <p>Właścicielem serwisu Copility dostępnego pod adresem https://copility.com jest:</p>
          <p>
            PROFITFLOW SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ<br />
            UL. OGRODOWA 3, 32-652 BULOWICE<br />
            NIP: (tutaj możesz dodać numer jeśli chcesz)<br />
            E-mail kontaktowy: support@copility.com
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Definicje</h2>
          <p>
            <strong>Użytkownik</strong> – osoba fizyczna lub prawna korzystająca z serwisu.<br />
            <strong>Serwis</strong> – platforma internetowa Copility umożliwiająca generowanie treści marketingowych z wykorzystaniem AI.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Warunki korzystania z Serwisu</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>Z serwisu mogą korzystać osoby powyżej 18 roku życia.</li>
            <li>Korzystanie z Copility wymaga utworzenia konta oraz zaakceptowania niniejszego regulaminu i polityki prywatności.</li>
            <li>Użytkownik zobowiązuje się do korzystania z serwisu w sposób zgodny z obowiązującym prawem i dobrymi obyczajami.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Zakres świadczonych usług</h2>
          <p>Copility umożliwia:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Generowanie skryptów reklamowych, postów do social mediów oraz e-maili sprzedażowych.</li>
            <li>Tworzenie treści dopasowanych do grupy docelowej.</li>
            <li>Korzystanie z zaawansowanych technologii AI (m.in. NeuroScript™).</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Cennik i subskrypcje</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>Użytkownik może wykupić subskrypcję płatną miesięcznie lub rocznie.</li>
            <li>Pierwsze 3 dni korzystania z Copility są bezpłatne (wersja próbna).</li>
            <li>Płatności obsługiwane są przez zewnętrznego operatora Stripe.</li>
            <li>Brak możliwości zwrotu po rozpoczęciu płatnego okresu subskrypcji.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Dane osobowe</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>Administratorem danych jest PROFITFLOW Sp. z o.o.</li>
            <li>Szczegóły dotyczące przetwarzania danych znajdują się w Polityce Prywatności.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Zasady odpowiedzialności</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>Copility nie ponosi odpowiedzialności za skutki decyzji podjętych na podstawie treści wygenerowanych przez narzędzie.</li>
            <li>Użytkownik ponosi pełną odpowiedzialność za sposób wykorzystania wygenerowanych materiałów.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Prawa autorskie</h2>
          <p>
            Treści wygenerowane przez Copility są przeznaczone wyłącznie dla Użytkownika i nie mogą być kopiowane 
            lub dystrybuowane bez zgody właściciela serwisu.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Zmiany regulaminu</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>Copility zastrzega sobie prawo do wprowadzania zmian w regulaminie.</li>
            <li>O wszelkich zmianach Użytkownicy zostaną poinformowani poprzez e-mail lub komunikat w serwisie.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Reklamacje i kontakt</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>Reklamacje należy zgłaszać mailowo na adres support@copility.com.</li>
            <li>Czas rozpatrzenia reklamacji wynosi do 14 dni roboczych.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Postanowienia końcowe</h2>
          <ul className="list-disc pl-6 mb-4">
            <li>W sprawach nieuregulowanych niniejszym regulaminem zastosowanie mają przepisy prawa polskiego.</li>
            <li>Ewentualne spory rozpatrywane będą przez właściwy sąd zgodnie z przepisami Kodeksu cywilnego.</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsOfService;
