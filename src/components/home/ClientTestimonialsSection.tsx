
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
    image: "/lovable-uploads/da2cf7cd-0efe-4f32-bbb4-745465b0bc10.png"
  },
  {
    id: 2,
    quote: "Odkąd zaczęliśmy korzystać z Copility, nasze kampanie w social mediach osiągają o 65% lepsze wyniki. To narzędzie dokładnie trafia w naszą grupę docelową.",
    author: "Michał Kowalski",
    role: "Digital Marketing Director, GrowthGenius",
    image: "/lovable-uploads/c4f57be2-035e-45ff-ac74-f14cb7a4542d.png"
  }
];

const ClientTestimonialsSection = () => {
  return (
    <section className="py-20 bg-white text-black">
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
                <Avatar className="h-24 w-24 md:h-32 md:w-32 rounded-none">
                  <AvatarImage src={testimonial.image} alt={testimonial.author} className="object-cover" />
                  <AvatarFallback className="text-2xl bg-copywrite-teal">{testimonial.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
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
