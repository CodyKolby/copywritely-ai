
import { toast } from 'sonner';
import { PRICE_IDS } from './client';
import { supabase } from '@/integrations/supabase/client';

export const createCheckoutSession = async (priceId: string) => {
  try {
    console.log('Starting checkout process with priceId', priceId);
    
    // Basic validation
    if (!priceId) {
      throw new Error('Nieprawidłowy identyfikator cennika');
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Musisz być zalogowany aby dokonać zakupu');
    }

    // Get stored user email
    const userEmail = localStorage.getItem('userEmail');
    
    // Ensure absolute URLs with full domain
    const fullOrigin = window.location.origin;
    const successUrl = `${fullOrigin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${fullOrigin}/pricing?canceled=true`;

    console.log('Preparing checkout session with params:', {
      priceId,
      userEmail: userEmail ? 'Email provided' : 'Not provided',
      userId: user.id,
      successUrl,
      cancelUrl
    });
    
    // Zamiast używać stripe.redirectToCheckout, użyjmy funkcji edge do utworzenia sesji
    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: {
        priceId,
        customerEmail: userEmail || undefined,
        userId: user.id,
        successUrl,
        cancelUrl
      }
    });
    
    if (error) {
      console.error('Stripe checkout error:', error);
      throw new Error(error.message || 'Błąd podczas tworzenia sesji płatności');
    }

    if (data?.url) {
      console.log('Redirecting to Stripe checkout URL:', data.url);
      // Zapisz flagę informującą o trwającym procesie checkout
      sessionStorage.setItem('stripeCheckoutInProgress', 'true');
      sessionStorage.setItem('redirectingToStripe', 'true');
      
      // Przekieruj do URL sesji Stripe
      window.location.href = data.url;
      return true;
    } else {
      throw new Error('Nie otrzymano URL sesji checkout');
    }
    
  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    // Clear session storage flags
    sessionStorage.removeItem('stripeCheckoutInProgress');
    sessionStorage.removeItem('redirectingToStripe');
    
    let errorMessage = error instanceof Error ? error.message : 'Nie można uruchomić procesu płatności';
    
    toast.error('Wystąpił błąd', {
      description: errorMessage
    });

    return false;
  }
};
