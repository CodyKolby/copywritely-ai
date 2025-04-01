
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

// Counter animation component
const Counter = ({ end, label, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const counterRef = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime;
          const duration = 2000; // 2 seconds
          
          const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const currentCount = Math.floor(progress * end);
            
            setCount(currentCount);
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.1 }
    );
    
    if (counterRef.current) {
      observer.observe(counterRef.current);
    }
    
    return () => {
      if (counterRef.current) {
        observer.unobserve(counterRef.current);
      }
    };
  }, [end, hasAnimated]);
  
  const formattedCount = count.toLocaleString('pl-PL');
  
  return (
    <div ref={counterRef} className="flex flex-col items-center">
      <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-copywrite-teal mb-2">
        {prefix}{formattedCount}{suffix}
      </div>
      <div className="text-sm md:text-base text-center max-w-[180px] md:max-w-[220px]">
        {label}
      </div>
    </div>
  );
};

const SocialProofSection = () => {
  return (
    <section className="py-14 px-6 bg-gray-50">
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="max-w-6xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <Counter 
            end={17821} 
            label="Wygenerowanych skryptów reklamowych" 
          />
          <Counter 
            end={427} 
            label="Zadowolonych użytkowników Copility" 
          />
          <Counter 
            end={965540} 
            prefix="" 
            suffix=" zł" 
            label="Wygenerowanych przychodów przez naszych klientów" 
          />
        </div>
      </motion.div>
    </section>
  );
};

export default SocialProofSection;
