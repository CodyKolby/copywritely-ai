
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const SuccessState = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 text-green-500">
        <CheckCircle className="w-full h-full" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Płatność zakończona sukcesem!</h2>
      <p className="text-gray-600 mb-6">
        Dziękujemy za wykupienie subskrypcji. Twoje konto zostało zaktualizowane do wersji Premium.
        Możesz teraz korzystać z wszystkich funkcji naszej aplikacji.
      </p>
      <Button 
        onClick={() => navigate('/projekty')}
        className="bg-copywrite-teal hover:bg-copywrite-teal-dark flex items-center gap-2"
      >
        Przejdź do projektów
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
};
