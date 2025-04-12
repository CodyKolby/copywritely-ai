
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
      text: "Na początku byłam totalnie sceptyczna. Pomyślałam sobie że Copility to pewnie kolejne AI które produkuje suche, bezwartościowe teksty. Wystarczył jeden skrypt żeby zmienić moje podejście. Wygenerowałam go, wrzuciłam do kampanii i po tygodniu koszt za rezultat spadł trzy razy.",
      author: "Beata Janiecka",
      date: "07 stycznia, 2025"
    },
    {
      id: 2,
      text: "Korzystam z Copility od trzech miesięcy i od tamtej pory moje konto na TikToku przebiło 5 milionów wyświetleń. Skrypty które generuję wrzucam praktycznie bez większych zmian. Trafiają idealnie w moją grupę docelową i oszczędzają mi mnóstwo czasu. Szczerze, nie wyobrażam sobie teraz prowadzić mojego biznesu bez Copility.",
      author: "Szymon Zaremba",
      date: "12 marca, 2025"
    },
    {
      id: 3,
      text: "Nie wiem jak wcześniej ogarniałem reklamy bez Copility. Potrafiłem siedzieć po kilka godzin dziennie i kombinować ze skryptami, które i tak nie działały, a od kiedy go używam, moja konwersja poszła w górę o 40 procent, a ja mam znacznie więcej czasu dla siebie.",
      author: "Maciej Graczykowski",
      date: "22 marca, 2025"
    },
    {
      id: 4,
      text: "Jako agencja przetestowaliśmy chyba wszystkie możliwe narzędzia AI do pisania tekstów reklamowych. Większość wyglądała dobrze tylko na papierze. Copility realnie nas zaskoczyło. Skrypty które generuje nie tylko brzmią dobrze, ale przede wszystkim dowożą wyniki. Zwiększyły sprzedaż u naszych klientów, więc sami zaczęliśmy je polecać dalej.",
      author: "Marcin Rak",
      date: "10 kwietnia, 2025"
    },
    {
      id: 5,
      text: "Zanim trafiłem na Copility, byłem o krok od zamknięcia sklepu. Przychody leżały, nic się nie spinało. Zacząłem używać ich gotowych maili i postów na social media i wszystko się zmieniło. W zeszłym miesiącu pierwszy raz od dawna wyszedłem na konkretny plus. 30 tysięcy zł zysku.",
      author: "Joanna Kolber",
      date: "18 marca, 2025"
    },
    {
      id: 6,
      text: "Nie jestem ekspertem od marketingu. Moją misją jest pomaganie kobietom w osiąganiu wymarzonej sylwetki, a sprzedaż i pisanie tekstów to była dla mnie czysta męczarnia. Aż jeden znajomy wspomniał mi o Copility. Od tamtej pory marketing ogarniam w kilkanaście minut dziennie, tylko czytam gotowe skrypty. A resztę dnia mogę poświęcić na to, co kocham najbardziej.",
      author: "Maja Pawluk",
      date: "4 kwietnia, 2025"
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
  }, 10000);

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
