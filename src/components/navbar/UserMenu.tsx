
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, FolderOpen, CreditCard, Shield, RefreshCw } from 'lucide-react';
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
import { toast } from 'sonner';

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
  const [isCheckingPremium, setIsCheckingPremium] = useState(false);

  const getInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  // Force direct database check for premium status
  const verifyPremiumDirectly = async () => {
    setIsCheckingPremium(true);
    try {
      console.log('[UserMenu] Directly checking premium status for user:', user.id);
      const { data: dbProfile, error } = await supabase
        .from('profiles')
        .select('id, is_premium, subscription_status, subscription_expiry')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('[UserMenu] Error fetching profile:', error);
        return false;
      }
      
      if (dbProfile) {
        console.log('[UserMenu] Direct DB check result:', dbProfile);
        
        // Check expiry
        const isExpired = dbProfile.subscription_expiry ? 
          new Date(dbProfile.subscription_expiry) < new Date() : false;
        
        if (isExpired) {
          console.log('[UserMenu] Subscription expired according to date');
          return false;
        }
        
        // Premium is valid if explicitly true and not expired
        if (dbProfile.is_premium === true) {
          console.log('[UserMenu] User has valid premium status');
          return true;
        }
      }
      
      return false;
    } catch (e) {
      console.error('[UserMenu] Error in direct premium check:', e);
      return false;
    } finally {
      setIsCheckingPremium(false);
    }
  };

  // Check all premium indicators and update local state
  useEffect(() => {
    const verifyPremiumStatus = async () => {
      console.log('[UserMenu] Verifying premium status with inputs:', {
        contextIsPremium: isPremium,
        localPremium,
        profileIsPremium: profile?.is_premium,
        userId: user.id
      });
      
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
          } else {
            console.log('[UserMenu] Subscription not expired, expiry date:', profile.subscription_expiry);
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
        } else if (profile.is_premium === false) {
          console.log('[UserMenu] Profile explicitly has is_premium=false');
          isPremiumUser = false;
        }
      }
      
      // If we're still uncertain, double check with database directly
      if (!isPremiumUser) {
        const directCheck = await verifyPremiumDirectly();
        if (directCheck) {
          console.log('[UserMenu] Direct DB check confirms premium status');
          isPremiumUser = true;
        }
      }
      
      // Update local state based on all checks
      console.log('[UserMenu] Final premium determination:', isPremiumUser);
      setEffectivePremium(isPremiumUser);
    };
    
    verifyPremiumStatus();
  }, [user.id, isPremium, profile, localPremium]);

  const handleSignOut = () => {
    // Clear localStorage premium backup on logout
    clearPremiumFromLocalStorage();
    signOut();
  };

  const handleRefreshPremium = async () => {
    setIsCheckingPremium(true);
    try {
      const directCheck = await verifyPremiumDirectly();
      if (directCheck) {
        setEffectivePremium(true);
        toast.success('Status premium potwierdzony');
      } else {
        toast.info('Status premium nie został potwierdzony');
      }
    } finally {
      setIsCheckingPremium(false);
    }
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
              <div className="flex items-center gap-1">
                <p className="text-xs leading-none text-muted-foreground">
                  {effectivePremium ? 'Konto Premium' : 'Konto Free'}
                </p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0 text-muted-foreground hover:text-copywrite-teal"
                  onClick={handleRefreshPremium}
                  disabled={isCheckingPremium}
                >
                  <RefreshCw className={`h-3 w-3 ${isCheckingPremium ? 'animate-spin' : ''}`} />
                </Button>
              </div>
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
