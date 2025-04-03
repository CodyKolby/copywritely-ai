
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SuccessStateProps {
  redirectTimer?: number;
  onButtonClick?: () => void;
}

export const SuccessState = ({ redirectTimer, onButtonClick }: SuccessStateProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      navigate('/projekty');
    }
  };
  
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
        onClick={handleClick}
        className="bg-copywrite-teal hover:bg-copywrite-teal-dark flex items-center gap-2"
      >
        Przejdź do projektów
        <ArrowRight className="w-4 h-4" />
      </Button>
      
      {redirectTimer !== undefined && redirectTimer > 0 && (
        <p className="text-sm text-gray-500 mt-4">
          Za {2 - redirectTimer} {(2 - redirectTimer) === 1 ? 'sekundę' : 'sekundy'} zostaniesz przekierowany do projektów...
        </p>
      )}
    </div>
  );
};
