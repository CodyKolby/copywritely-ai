
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CTASection = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <Link to="/pricing">
          <Button className="h-12 px-8 rounded-lg bg-copywrite-teal text-white hover:bg-copywrite-teal/90 transition-colors">
            Wypróbuj za darmo
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default CTASection;
