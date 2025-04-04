
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User as UserIcon, FolderOpen, CreditCard, Shield } from 'lucide-react';
import { Profile } from '@/contexts/auth/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import SubscriptionModal from '../subscription/SubscriptionModal';
import { checkAllPremiumStorages } from '@/contexts/auth/local-storage-utils';

interface UserMenuProps {
  user: User;
  profile: Profile | null;
  isPremium: boolean;
  localPremium: boolean;
  signOut: () => void;
}

export const UserMenu = ({ user, profile, isPremium, localPremium, signOut }: UserMenuProps) => {
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [storagePremium, setStoragePremium] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const premiumFromStorage = checkAllPremiumStorages();
    setStoragePremium(premiumFromStorage);
  }, []);

  // Update storage premium when props change
  useEffect(() => {
    if (isPremium || profile?.is_premium || localPremium) {
      setStoragePremium(true);
    }
  }, [isPremium, profile, localPremium]);

  const getInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  // User has premium if any of the premium indicators are true
  const userHasPremium = isPremium || profile?.is_premium || localPremium || storagePremium;

  const handleSignOut = () => {
    // Clear localStorage premium backup on logout
    localStorage.removeItem('premium_backup');
    localStorage.removeItem('premium_timestamp');
    sessionStorage.removeItem('premium_session');
    signOut();
  };

  return (
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
            {userHasPremium && (
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
                {userHasPremium ? 'Konto Premium' : 'Konto Free'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2">
            <UserIcon size={16} /> 
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
          <DropdownMenuItem 
            onClick={handleSignOut} 
            className="gap-2 text-red-500"
          >
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
  );
};
