
import { useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface AnimatedTransitionProps {
  children: ReactNode;
}

const AnimatedTransition = ({ children }: AnimatedTransitionProps) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<'fadeIn' | 'fadeOut'>('fadeIn');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut');
    }
  }, [location, displayLocation]);

  const handleAnimationEnd = () => {
    if (transitionStage === 'fadeOut') {
      setTransitionStage('fadeIn');
      setDisplayLocation(location);
    }
  };

  return (
    <div
      className={`${
        transitionStage === 'fadeIn' ? 'animate-blur-in' : 'animate-fade-out'
      } min-h-screen`}
      onAnimationEnd={handleAnimationEnd}
    >
      {children}
    </div>
  );
};

export default AnimatedTransition;
