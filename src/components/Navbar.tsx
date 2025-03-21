
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LogIn } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/brief-generator', label: 'Brief Generator' },
    { path: '/copy-editor', label: 'Copy Editor' },
    { path: '/about', label: 'About' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 md:px-10',
        scrolled ? 'py-3 glass shadow-soft' : 'py-5'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-copywrite-teal text-2xl font-semibold tracking-tight">
            Copywritely
          </span>
          <span className="text-copywrite-teal-dark text-lg">AI</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} active={location.pathname === item.path}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/login">
            <button className="flex items-center gap-2 bg-copywrite-teal text-white py-2 px-4 rounded-md hover:bg-copywrite-teal-dark transition-colors">
              <LogIn size={18} />
              <span className="hidden sm:inline">Log in</span>
            </button>
          </Link>
          
          <div className="md:hidden">
            {/* Mobile menu button (simplified for now) */}
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-copywrite-teal"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

interface NavLinkProps {
  to: string;
  active: boolean;
  children: React.ReactNode;
}

const NavLink = ({ to, active, children }: NavLinkProps) => (
  <Link to={to} className="relative group">
    <motion.span
      className={cn(
        "inline-block py-1 transition-colors duration-300",
        active ? "text-copywrite-teal" : "text-gray-700 hover:text-copywrite-teal"
      )}
    >
      {children}
    </motion.span>
    {active && (
      <motion.div
        layoutId="navbar-indicator"
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-copywrite-teal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    )}
  </Link>
);

export default Navbar;
