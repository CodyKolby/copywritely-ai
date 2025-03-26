
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LogIn, LogOut, User, Menu, FolderOpen, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import SubscriptionModal from './subscription/SubscriptionModal';

const Navbar = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { user, signOut, isPremium } = useAuth();
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);

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
    { path: '/script-generator', label: 'Script Generator' },
    { path: '/pricing', label: 'Pricing' },
    { path: '/about', label: 'About' },
  ];

  const getInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 md:px-10',
        scrolled ? 'py-3 bg-white shadow-soft' : 'py-5 bg-white'
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
          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarImage src={user.user_metadata?.avatar_url} alt="Profile" />
                      <AvatarFallback className="bg-copywrite-teal text-white">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    {isPremium && (
                      <div className="absolute -top-1 -right-1 bg-amber-400 text-white rounded-full p-0.5">
                        <Shield className="h-3 w-3" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {isPremium ? 'Konto Premium' : 'Konto Free'}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2">
                    <User size={16} /> 
                    <span>Profil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="gap-2">
                    <Link to="/projekty">
                      <FolderOpen size={16} /> 
                      <span>Projekty</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSubscriptionModalOpen(true)} className="gap-2">
                    <CreditCard size={16} /> 
                    <span>Subskrypcja</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="gap-2 text-red-500">
                    <LogOut size={16} /> 
                    <span>Wyloguj</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <SubscriptionModal 
                open={subscriptionModalOpen}
                onOpenChange={setSubscriptionModalOpen}
              />
            </>
          ) : (
            <Link to="/login">
              <Button variant="default" className="bg-copywrite-teal hover:bg-copywrite-teal-dark flex items-center gap-2 text-white">
                <LogIn size={18} />
                <span className="hidden sm:inline">Zaloguj</span>
              </Button>
            </Link>
          )}
          
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6 text-copywrite-teal" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link 
                      to={item.path} 
                      className={cn(
                        "w-full", 
                        location.pathname === item.path ? "text-copywrite-teal" : ""
                      )}
                    >
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
