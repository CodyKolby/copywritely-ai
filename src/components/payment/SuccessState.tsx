
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

interface SuccessStateProps {
  redirectTimer: number;
}

export const SuccessState: React.FC<SuccessStateProps> = ({ redirectTimer }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 text-green-500">
        <CheckCircle size={80} />
      </div>
      <h2 className="text-2xl font-bold mb-4">Płatność zakończona pomyślnie!</h2>
      <p className="text-gray-600 mb-4 text-center">
        Twoje konto zostało zaktualizowane do wersji Premium.
        {redirectTimer > 0 && <span> Nastąpi przekierowanie...</span>}
      </p>
      <div className="flex gap-4 mt-4">
        <Button asChild>
          <Link to="/projekty">Przejdź do projektów</Link>
        </Button>
      </div>
    </div>
  );
};
