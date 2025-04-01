
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CTASection = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-copywrite-teal mb-6">
          Przekonaj się, jak Copility może pomóc Twojemu biznesowi
        </h2>
        <p className="text-xl text-black/80 mb-8 max-w-2xl mx-auto">
          Dołącz do 427+ zadowolonych użytkowników i zacznij tworzyć skuteczne skrypty sprzedażowe już dziś.
        </p>
        <Link to="/script-generator">
          <Button className="h-12 px-8 rounded-lg bg-copywrite-teal text-white hover:bg-copywrite-teal/90 transition-colors">
            Wypróbuj za darmo
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CTASection;
