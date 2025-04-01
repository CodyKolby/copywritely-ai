
import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  role: string;
  image: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote: "Copility zrewolucjonizował sposób, w jaki tworzymy treści marketingowe. Dzięki temu narzędziu nasza konwersja wzrosła o 47% w zaledwie dwa miesiące.",
    author: "Piotr Nowak",
    role: "CEO, Marketing Masters",
    image: "/lovable-uploads/fce3ac6c-a9e7-43a4-98c1-5e9f01f4fb79.png"
  },
  {
    id: 2,
    quote: "Odkąd zaczęliśmy korzystać z Copility, nasze kampanie w social mediach osiągają o 65% lepsze wyniki. To narzędzie dokładnie trafia w naszą grupę docelową.",
    author: "Michał Kowalski",
    role: "Digital Marketing Director, GrowthGenius",
    image: "/lovable-uploads/91b6bc7e-9450-4eb0-9ba8-63c1b5165afc.png"
  }
];

const ClientTestimonialsSection = () => {
  return (
    <section className="py-20 bg-gray-50 text-black">
      <div className="container px-4 mx-auto">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          {testimonials.map((testimonial) => (
            <motion.div 
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: testimonial.id * 0.1 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row gap-6 md:gap-8"
            >
              <div className="flex-shrink-0">
                <div className="h-full w-32 md:w-48">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.author}
                    className="w-full h-full object-cover object-center rounded-md"
                  />
                </div>
              </div>
              
              <div className="flex flex-col justify-center">
                <p className="text-black mb-6 text-xl font-medium">
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center">
                  <div className="w-8 h-0.5 bg-copywrite-teal mr-3"></div>
                  <div>
                    <p className="font-bold text-lg">{testimonial.author}</p>
                    <p className="text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ClientTestimonialsSection;
