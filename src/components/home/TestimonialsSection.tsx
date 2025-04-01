
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useInterval } from '@/hooks/use-interval';

interface Testimonial {
  id: number;
  text: string;
  author: string;
  date: string;
}

const TestimonialsSection = () => {
  const testimonials: Testimonial[] = [
    {
      id: 1,
      text: "Dzięki Copility udało mi się w ciągu kilku minut stworzyć kampanię, która wygenerowała trzykrotny zwrot z inwestycji. Jestem pod ogromnym wrażeniem jakości generowanych tekstów!",
      author: "Marta Kowalska",
      date: "15 marca, 2023"
    },
    {
      id: 2,
      text: "Korzystam z Copility od trzech miesięcy i mogę śmiało powiedzieć, że to najlepsze narzędzie tego typu na rynku. Skrypty reklamowe, które generuje, są nie tylko skuteczne, ale też idealnie dopasowane do mojej grupy docelowej.",
      author: "Tomasz Wiśniewski",
      date: "7 kwietnia, 2023"
    },
    {
      id: 3,
      text: "Od kiedy zacząłem używać Copility, moje kampanie reklamowe generują o 40% więcej konwersji. To naprawdę działa! Polecam każdemu, kto chce zaoszczędzić czas i zwiększyć skuteczność swoich reklam.",
      author: "Adam Nowak",
      date: "22 maja, 2023"
    },
    {
      id: 4,
      text: "Jako agencja marketingowa, testowaliśmy wiele narzędzi AI do tworzenia tekstów reklamowych. Copility zdecydowanie wyróżnia się na tle konkurencji - generuje treści, które rzeczywiście zwiększają sprzedaż.",
      author: "Joanna Dąbrowska",
      date: "10 czerwca, 2023"
    },
    {
      id: 5,
      text: "Bałem się, że treści generowane przez AI będą brzmiały sztucznie, ale Copility pozytywnie mnie zaskoczyło. Teksty są naturalne, perswazyjne i idealnie trafiają w potrzeby moich klientów.",
      author: "Piotr Zieliński",
      date: "3 lipca, 2023"
    },
    {
      id: 6,
      text: "Nie jestem specjalistą od marketingu, ale dzięki Copility moje reklamy wyglądają profesjonalnie i przyciągają klientów. To narzędzie znacząco uprościło prowadzenie mojego biznesu online.",
      author: "Aleksandra Majewska",
      date: "19 sierpnia, 2023"
    }
  ];

  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);

  const handleSelect = React.useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  }, [api]);

  useInterval(() => {
    if (!api) return;
    api.scrollNext();
  }, 8000);

  useEffect(() => {
    if (!api) return;
    handleSelect();
    api.on("select", handleSelect);
    api.on("reInit", handleSelect);
    
    return () => {
      api.off("select", handleSelect);
    };
  }, [api, handleSelect]);

  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Co mówią nasi użytkownicy?
          </h2>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative"
        >
          <Carousel 
            className="w-full max-w-3xl mx-auto"
            setApi={setApi}
          >
            <CarouselContent>
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id}>
                  <Card className="border-0 shadow-lg bg-white rounded-xl overflow-hidden">
                    <CardContent className="p-8">
                      <div className="flex mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-green-500 fill-green-500" />
                        ))}
                      </div>
                      <p className="text-gray-800 text-lg mb-8">{testimonial.text}</p>
                      <div>
                        <h4 className="font-bold text-xl mb-1">{testimonial.author}</h4>
                        <p className="text-gray-500">{testimonial.date}</p>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 lg:-translate-x-16 border-0 bg-white shadow-md hover:bg-gray-100">
              <ChevronLeft className="h-6 w-6" />
            </CarouselPrevious>
            <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 lg:translate-x-16 border-0 bg-white shadow-md hover:bg-gray-100">
              <ChevronRight className="h-6 w-6" />
            </CarouselNext>
          </Carousel>
          
          <div className="flex justify-center mt-6 gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                  current === index ? 'bg-copywrite-teal' : 'bg-gray-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
