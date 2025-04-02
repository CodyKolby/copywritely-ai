
import { useEffect } from 'react';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Get current date in format DD.MM.YYYY
  const getCurrentDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <div className="pt-24 pb-16 px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">Polityka Prywatności Copility</h1>
          <p className="text-gray-600 mb-8">Data ostatniej aktualizacji: {getCurrentDate()}</p>

          <p>
            Niniejsza Polityka Prywatności określa zasady przetwarzania i ochrony danych osobowych przekazywanych przez użytkowników 
            w związku z korzystaniem z serwisu copility.com, którego właścicielem jest PROFITFLOW Spółka z ograniczoną odpowiedzialnością 
            z siedzibą przy ul. Ogrodowej 3, 32-652 Bulowice.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Administrator danych osobowych</h2>
          <p>
            Administratorem danych osobowych jest:<br />
            PROFITFLOW SP. Z O.O.<br />
            Adres: ul. Ogrodowa 3, 32-652 Bulowice<br />
            E-mail: support@copility.com
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Zakres zbieranych danych</h2>
          <p>Zbieramy następujące dane osobowe:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Imię</li>
            <li>Adres e-mail</li>
          </ul>
          <p>Dane te są podawane dobrowolnie podczas rejestracji i zapisu na newsletter.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Cel i podstawa przetwarzania danych</h2>
          <p>Twoje dane są przetwarzane w celu:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Wysyłki informacji marketingowych i newslettera,</li>
            <li>Potwierdzania rejestracji i komunikacji związanej z obsługą konta,</li>
            <li>Prowadzenia analiz skuteczności działania narzędzi AI,</li>
            <li>Dochowania obowiązków wynikających z przepisów prawa.</li>
          </ul>
          <p>Podstawą prawną przetwarzania danych jest zgoda użytkownika.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Udostępnianie danych osobowych</h2>
          <p>Dane mogą być udostępnione następującym podmiotom:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Stripe – obsługa płatności,</li>
            <li>Supabase – baza danych i hosting,</li>
            <li>Dostawca oprogramowania do e-mail marketingu (aktualnie w trakcie wyboru).</li>
          </ul>
          <p>Podmioty te przetwarzają dane zgodnie z podpisanymi umowami powierzenia przetwarzania danych.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Pliki cookies i narzędzia analityczne</h2>
          <p>
            Serwis wykorzystuje pliki cookies do celów statystycznych, funkcjonalnych i marketingowych. 
            Użytkownik może zmienić ustawienia dotyczące plików cookies w swojej przeglądarce.
          </p>
          <p>
            W przyszłości możliwe będzie wykorzystanie narzędzi analitycznych, takich jak Google Analytics, 
            Facebook Pixel lub Hotjar.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Prawa użytkownika</h2>
          <p>Masz prawo do:</p>
          <ul className="list-disc pl-6 mb-4">
            <li>Dostępu do swoich danych,</li>
            <li>Sprostowania danych,</li>
            <li>Usunięcia danych,</li>
            <li>Ograniczenia przetwarzania,</li>
            <li>Wniesienia sprzeciwu,</li>
            <li>Cofnięcia zgody,</li>
            <li>Złożenia skargi do organu nadzorczego.</li>
          </ul>
          <p>
            Wszelkie zapytania i wnioski dotyczące danych osobowych prosimy kierować na adres: 
            support@copility.com.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Przechowywanie danych</h2>
          <p>
            Dane przechowywane są w systemie Supabase. Nie określamy konkretnego czasu przechowywania 
            danych – są one przechowywane do momentu, aż użytkownik nie zażąda ich usunięcia.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Bezpieczeństwo danych</h2>
          <p>
            Wdrażamy środki bezpieczeństwa dostępne w wykorzystywanych przez nas platformach technologicznych, 
            takich jak Supabase oraz infrastruktura partnerów hostingowych i technologicznych (np. Lovable).
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Dzieci i osoby niepełnoletnie</h2>
          <p>
            Nasze usługi nie są kierowane do osób poniżej 18. roku życia. Nie przetwarzamy świadomie danych 
            takich osób.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Zmiany w polityce prywatności</h2>
          <p>
            Zastrzegamy sobie prawo do wprowadzania zmian w niniejszej Polityce Prywatności. Nowa wersja 
            dokumentu będzie publikowana na stronie internetowej wraz z datą aktualizacji.
          </p>
          <p>
            W przypadku pytań dotyczących polityki prywatności zapraszamy do kontaktu pod adresem: 
            support@copility.com.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
