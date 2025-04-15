import { User } from '@supabase/supabase-js';
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, FolderOpen, CreditCard, Shield, RefreshCw, AlertCircle } from 'lucide-react';
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
import { testCriticalFunctions } from '@/lib/stripe/user-diagnostics-client';

interface UserMenuProps {
  user: User;
  profile: Profile | null;
  isPremium: boolean;
  localPremium: boolean;
  signOut: () => void;
}

export const UserMenu = ({ user, profile, isPremium, localPremium, signOut }: UserMenuProps) => {
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [effectivePremium, setEffectivePremium] = useState(isPremium || localPremium);
  const [isCheckingPremium, setIsCheckingPremium] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const getInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const verifyPremiumDirectly = useCallback(async () => {
    if (!user?.id) return false;
    
    setIsCheckingPremium(true);
    try {
      console.log('[UserMenu] Directly checking premium status for user:', user.id);
      const { data: dbProfile, error } = await supabase
        .from('profiles')
        .select('id, is_premium, subscription_status, subscription_expiry')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('[UserMenu] Error fetching profile:', error);
        return false;
      }
      
      if (dbProfile) {
        console.log('[UserMenu] Direct DB check result:', dbProfile);
        
        if (dbProfile.subscription_expiry) {
          const isExpired = new Date(dbProfile.subscription_expiry) < new Date();
          
          if (isExpired) {
            console.log('[UserMenu] Subscription expired according to date');
            return false;
          }
        }
        
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
  }, [user?.id]);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      console.log('[UserMenu] Checking premium status with inputs:', {
        contextIsPremium: isPremium,
        localPremium,
        profileIsPremium: profile?.is_premium,
        userIdAvailable: !!user?.id
      });
      
      if (!user?.id) {
        console.log('[UserMenu] No user ID available, skipping premium check');
        setEffectivePremium(false);
        return;
      }
      
      const directCheckResult = await verifyPremiumDirectly();
      
      if (directCheckResult) {
        console.log('[UserMenu] Direct check confirms premium status');
        setEffectivePremium(true);
        return;
      }
      
      if (profile) {
        if (profile.subscription_expiry) {
          const isExpired = new Date(profile.subscription_expiry) < new Date();
          if (isExpired) {
            console.log('[UserMenu] Premium expired according to expiry date');
            setEffectivePremium(false);
            return;
          }
        }
        
        if (profile.subscription_status === 'canceled') {
          console.log('[UserMenu] Subscription is canceled');
          setEffectivePremium(false);
          return;
        }
        
        if (profile.is_premium === true) {
          console.log('[UserMenu] Profile explicitly has is_premium=true');
          setEffectivePremium(true);
          return;
        }
      }
      
      setEffectivePremium(isPremium || localPremium);
    };
    
    checkPremiumStatus();
  }, [user?.id, isPremium, profile, localPremium, verifyPremiumDirectly]);

  const handleSignOut = () => {
    clearPremiumFromLocalStorage();
    signOut();
  };

  const handleRefreshPremium = async () => {
    setIsCheckingPremium(true);
    try {
      const directCheck = await verifyPremiumDirectly();
      setEffectivePremium(directCheck);
      
      if (directCheck) {
        toast.success('Status premium potwierdzony');
      } else {
        toast.info('Status premium nie został potwierdzony');
      }
    } finally {
      setIsCheckingPremium(false);
    }
  };

  const runDiagnostics = async () => {
    if (!user?.id) {
      toast.error('Brak ID użytkownika');
      return;
    }
    
    setIsDiagnosing(true);
    toast.info('Uruchamianie pełnej diagnostyki...', {
      id: 'diagnostics-start',
      duration: 3000
    });
    
    try {
      console.log('[DIAGNOSTICS] Starting full diagnostics for user:', user.id);
      
      toast.loading('Diagnostyka w toku...', {
        id: 'diagnostics-running',
        duration: 10000
      });
      
      const results = await testCriticalFunctions(user.id);
      console.log('[DIAGNOSTICS] Full diagnostic results:', results);
      
      if (results.summary?.criticalIssuesCount > 0) {
        toast.error(`Wykryto ${results.summary.criticalIssuesCount} krytyczne problemy`, {
          description: results.summary.mainIssue,
          duration: 8000
        });
      } else if (results.summary?.warningsCount > 0) {
        toast.warning(`Wykryto ${results.summary.warningsCount} ostrzeżenia`, {
          description: results.summary.mainIssue,
          duration: 8000
        });
      } else {
        toast.success('Diagnostyka zakończona - wszystko działa poprawnie', {
          duration: 5000
        });
      }
      
      for (const [testName, result] of Object.entries(results.tests)) {
        if (result.success === false) {
          console.error(`[DIAGNOSTICS] Test '${testName}' failed:`, result.error);
          toast.error(`Test '${testName}' nie powiódł się`, {
            description: typeof result.error === 'string' ? result.error : 'Szczegóły w konsoli',
            duration: 5000
          });
        } else {
          console.log(`[DIAGNOSTICS] Test '${testName}' completed:`, result);
        }
      }
      
      toast.dismiss('diagnostics-running');
    } catch (error) {
      console.error('[DIAGNOSTICS] Error running diagnostics:', error);
      toast.error('Błąd podczas diagnostyki', {
        description: error instanceof Error ? error.message : 'Nieznany błąd',
        duration: 8000
      });
      toast.dismiss('diagnostics-running');
    } finally {
      setIsDiagnosing(false);
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
          <DropdownMenuItem 
            onClick={runDiagnostics} 
            className="gap-2 text-amber-600"
            disabled={isDiagnosing}
          >
            <AlertCircle size={16} /> 
            <span>{isDiagnosing ? 'Diagnostyka...' : 'Diagnostyka konta'}</span>
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
