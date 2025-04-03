
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { NavLink } from './navbar/NavLink';
import { MobileMenu } from './navbar/MobileMenu';
import { UserMenu } from './navbar/UserMenu';
import { useNavbar } from './navbar/useNavbar';

const Navbar = () => {
  const location = useLocation();
  const { user, signOut, isPremium, profile } = useAuth();
  const { scrolled, localPremium, subscriptionModalOpen, setSubscriptionModalOpen, navItems } = useNavbar();

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 md:px-10',
        scrolled ? 'py-3 bg-white shadow-soft' : 'py-5 bg-white'
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img 
            src="/lovable-uploads/eea4437e-d9f4-424c-b7c8-582734b56106.png" 
            alt="Copility" 
            className="h-9" 
          />
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
            <UserMenu 
              user={user} 
              profile={profile} 
              isPremium={isPremium} 
              localPremium={localPremium}
              signOut={signOut}
            />
          ) : (
            <Link to="/login">
              <Button variant="default" className="bg-copywrite-teal hover:bg-copywrite-teal-dark flex items-center gap-2 text-white">
                <LogIn size={18} />
                <span className="hidden sm:inline">Zaloguj</span>
              </Button>
            </Link>
          )}
          
          <MobileMenu navItems={navItems} currentPath={location.pathname} />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
