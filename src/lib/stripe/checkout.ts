
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PRICE_IDS } from './client';

// Function to create checkout session - completely refactored
export const createCheckoutSession = async (priceId: string) => {
  try {
    // Don't show diagnostic messages for normal users, only in error cases
    console.log('Starting checkout process with priceId', priceId);
    
    // Basic validation
    if (!priceId) {
      console.error('Missing priceId');
      throw new Error('Nieprawidłowy identyfikator cennika');
    }

    const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
    if (!stripePublicKey) {
      console.error('Missing Stripe public key');
      throw new Error('Brak klucza Stripe');
    }

    // Get stored user email
    const userEmail = localStorage.getItem('userEmail');
    
    // Ensure absolute URLs with full domain
    const fullOrigin = window.location.origin;
    const successUrl = `${fullOrigin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${fullOrigin}/pricing?canceled=true`;

    console.log('Stripe checkout parameters:', {
      priceId,
      userEmail: userEmail ? 'Email provided' : 'Not provided',
      successUrl,
      cancelUrl,
      fullOrigin
    });
    
    toast.info('Rozpoczynam proces płatności');

    // Set a new checkout flag with timestamp ONLY when we're sure we're proceeding
    const timestamp = Date.now().toString();
    sessionStorage.setItem('stripeCheckoutInProgress', timestamp);
    
    toast.info('Łączenie z systemem płatności...', {
      duration: 10000, // Longer duration for this message
    });

    try {
      // Direct API call to Supabase function with timeout handling
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Przekroczono czas oczekiwania na odpowiedź')), 15000)
      );
      
      const fetchPromise = supabase.functions.invoke('stripe-checkout', {
        body: {
          priceId,
          customerEmail: userEmail || undefined,
          successUrl,
          cancelUrl,
          origin: fullOrigin
        }
      });
      
      // Race between the fetch and the timeout
      const result = await Promise.race([fetchPromise, timeoutPromise]);
      
      // If we get here, fetchPromise won the race
      const { data, error } = result as any;

      if (error) {
        // Only clear specific flags when there's an error
        sessionStorage.removeItem('stripeCheckoutInProgress');
        console.error('Supabase function error:', error);
        toast.error('Błąd API', { description: error.message || 'Błąd przy wywoływaniu funkcji Stripe' });
        throw new Error(error.message || 'Błąd przy wywoływaniu funkcji Stripe');
      }

      // Check for API-level errors
      if (data?.error) {
        // Only clear specific flags when there's an error
        sessionStorage.removeItem('stripeCheckoutInProgress');
        console.error('Stripe error:', data.error);
        toast.error('Błąd Stripe', { description: data.error });
        throw new Error(data.error);
      }

      // If function returned a URL, redirect user
      if (data?.url) {
        console.log('Received Stripe Checkout URL:', data.url);
        
        // Set redirect flag - WITH A TIMESTAMP to track this specific checkout
        sessionStorage.setItem('redirectingToStripe', timestamp);
        
        // Success toast - only show this when we have a URL
        toast.success('Przekierowujemy do strony płatności...', {
          description: 'Za chwilę zostaniesz przekierowany do bezpiecznej strony płatności Stripe',
        });
        
        // Force a direct window location change instead of setTimeout
        console.log('Redirecting to Stripe checkout page now');
        window.location.assign(data.url);
        
        return true;
      } else {
        // Only clear specific flags when there's an error
        sessionStorage.removeItem('stripeCheckoutInProgress');
        toast.error('Brak URL', { description: 'Nie otrzymano poprawnej odpowiedzi z serwera' });
        throw new Error('Nie otrzymano poprawnej odpowiedzi z serwera');
      }
    } catch (apiError) {
      console.error('API call error:', apiError);
      sessionStorage.removeItem('stripeCheckoutInProgress');
      
      toast.error('Problem z połączeniem', { 
        description: apiError instanceof Error ? apiError.message : 'Nie można połączyć się z systemem płatności'
      });
      
      return false;
    }
  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    // Only clear specific flags when there's an error
    sessionStorage.removeItem('stripeCheckoutInProgress');
    
    let errorMessage = error instanceof Error ? error.message : 'Nie można uruchomić procesu płatności';
    
    toast.error('Wystąpił błąd', {
      description: errorMessage
    });

    // Allow the button to be clickable again
    return false;
  }
};
