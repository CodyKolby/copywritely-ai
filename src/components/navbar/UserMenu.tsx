
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, FolderOpen, CreditCard, Shield } from 'lucide-react';
import { Profile } from '@/contexts/auth/types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import SubscriptionModal from '../subscription/SubscriptionModal';
import { clearPremiumFromLocalStorage } from '@/contexts/auth/local-storage-utils';
import { supabase } from '@/integrations/supabase/client';

interface UserMenuProps {
  user: User;
  profile: Profile | null;
  isPremium: boolean;
  localPremium: boolean;
  signOut: () => void;
}

export const UserMenu = ({ user, profile, isPremium, localPremium, signOut }: UserMenuProps) => {
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [effectivePremium, setEffectivePremium] = useState(false);

  const getInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  // Check all premium indicators and update local state
  useEffect(() => {
    const verifyPremiumStatus = async () => {
      // Start with context-provided premium status
      let isPremiumUser = isPremium;
      
      // If profile exists, check that first (it's the most reliable source)
      if (profile) {
        // Check expiry date if it exists
        if (profile.subscription_expiry) {
          const isExpired = new Date(profile.subscription_expiry) < new Date();
          if (isExpired) {
            console.log('[UserMenu] Premium expired according to expiry date');
            isPremiumUser = false;
          }
        }
        
        // Check for canceled status
        if (profile.subscription_status === 'canceled') {
          console.log('[UserMenu] Subscription is canceled');
          isPremiumUser = false;
        }
        
        // If profile.is_premium is explicitly true, user is premium
        if (profile.is_premium === true) {
          console.log('[UserMenu] Profile explicitly has is_premium=true');
          isPremiumUser = true;
        }
      }
      
      // Double check with database directly as last resort
      try {
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('is_premium, subscription_status, subscription_expiry')
          .eq('id', user.id)
          .single();
          
        if (dbProfile) {
          // If database explicitly says premium, trust that
          if (dbProfile.is_premium === true) {
            console.log('[UserMenu] Database confirms premium status');
            isPremiumUser = true;
          }
          
          // Check subscription status
          if (dbProfile.subscription_status === 'active') {
            console.log('[UserMenu] Database shows active subscription');
            isPremiumUser = true;
          }
          
          // Check expiry date
          if (dbProfile.subscription_expiry) {
            const isExpired = new Date(dbProfile.subscription_expiry) < new Date();
            if (isExpired) {
              console.log('[UserMenu] Premium expired according to database');
              isPremiumUser = false;
            }
          }
        }
      } catch (e) {
        console.error('[UserMenu] Error checking database for premium status:', e);
      }
      
      // Update local state based on all checks
      setEffectivePremium(isPremiumUser);
    };
    
    verifyPremiumStatus();
  }, [user, isPremium, profile, localPremium]);

  const handleSignOut = () => {
    // Clear localStorage premium backup on logout
    clearPremiumFromLocalStorage();
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
            {effectivePremium && (
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
                {effectivePremium ? 'Konto Premium' : 'Konto Free'}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
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
