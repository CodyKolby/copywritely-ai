
import { toast } from 'sonner';
import { PRICE_IDS } from './client';
import { supabase } from '@/integrations/supabase/client';

export const createCheckoutSession = async (priceId: string) => {
  try {
    console.log('[CHECKOUT] Starting checkout process with priceId', priceId);
    
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
    const userEmail = localStorage.getItem('userEmail') || user.email;
    
    // Ensure absolute URLs with full domain
    const fullOrigin = window.location.origin;
    const successUrl = `${fullOrigin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${fullOrigin}/pricing?canceled=true`;

    console.log('[CHECKOUT] Preparing checkout session with params:', {
      priceId,
      userEmail: userEmail ? 'Email provided' : 'Not provided',
      userId: user.id,
      successUrl,
      cancelUrl
    });
    
    // Ustaw flagę, że proces checkout jest w toku
    sessionStorage.setItem('stripeCheckoutInProgress', 'true');
    sessionStorage.setItem('redirectingToStripe', 'true');
    
    // Spróbuj z funkcją edge
    try {
      console.log('[CHECKOUT] Invoking stripe-checkout edge function');
      
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Timeout calling edge function'));
        }, 5000);
      });
      
      // Call edge function with timeout
      const { data, error } = await Promise.race([
        supabase.functions.invoke('stripe-checkout', {
          body: {
            priceId,
            customerEmail: userEmail || undefined,
            userId: user.id,
            successUrl,
            cancelUrl,
            timestamp: new Date().toISOString() // Dodaj timestamp, aby zapobiec cachowaniu
          }
        }),
        timeoutPromise
      ]);
      
      if (error) {
        console.error('[CHECKOUT] Stripe checkout error from edge function:', error);
        throw error;
      }

      if (data?.url) {
        console.log('[CHECKOUT] Redirecting to Stripe checkout URL:', data.url);
        
        // Przekieruj do URL sesji Stripe
        window.location.href = data.url;
        return true;
      } else {
        console.error('[CHECKOUT] No URL received from checkout session');
        throw new Error('Nie otrzymano URL sesji checkout');
      }
    } catch (edgeFunctionError) {
      // Jeśli funkcja edge zawiedzie, spróbuj z Netlify function jako fallback
      console.error('[CHECKOUT] Edge function failed, trying Netlify fallback:', edgeFunctionError);
      
      // Try Netlify fallback
      const netlifyUrl = `https://copywrite-assist.com/.netlify/functions/stripe-checkout`;
      
      console.log('[CHECKOUT] Calling Netlify function at:', netlifyUrl);
      
      const response = await fetch(netlifyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          customerEmail: userEmail,
          successUrl,
          cancelUrl,
          timestamp: new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        console.error('[CHECKOUT] Netlify function error:', await response.text());
        throw new Error('Błąd podczas tworzenia sesji w fallback');
      }
      
      const netlifyData = await response.json();
      
      if (netlifyData?.url) {
        console.log('[CHECKOUT] Redirecting to fallback Stripe checkout URL:', netlifyData.url);
        window.location.href = netlifyData.url;
        return true;
      } else {
        throw new Error('Fallback nie zwrócił URL sesji');
      }
    }
  } catch (error) {
    console.error('[CHECKOUT] Stripe checkout error:', error);
    
    // Wyczyść flagi sesji
    sessionStorage.removeItem('stripeCheckoutInProgress');
    sessionStorage.removeItem('redirectingToStripe');
    
    let errorMessage = error instanceof Error ? error.message : 'Nie można uruchomić procesu płatności';
    
    toast.error('Wystąpił błąd', {
      description: errorMessage
    });

    return false;
  }
};
