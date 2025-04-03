
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  to: string;
  active: boolean;
  children: React.ReactNode;
}

export const NavLink = ({ to, active, children }: NavLinkProps) => (
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
