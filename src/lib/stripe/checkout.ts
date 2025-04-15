
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
    
    // Set flag that checkout process is in progress
    sessionStorage.setItem('stripeCheckoutInProgress', 'true');
    sessionStorage.setItem('redirectingToStripe', 'true');
    
    try {
      console.log('[CHECKOUT] Invoking stripe-checkout edge function');
      
      // Call edge function with proper headers
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: {
          priceId,
          customerEmail: userEmail || undefined,
          successUrl,
          cancelUrl,
          timestamp: new Date().toISOString() // Add timestamp to prevent caching
        }
      });
      
      if (error) {
        console.error('[CHECKOUT] Stripe checkout error from edge function:', error);
        throw error;
      }

      if (data?.url) {
        console.log('[CHECKOUT] Redirecting to Stripe checkout URL:', data.url);
        
        // Redirect to Stripe session URL
        window.location.href = data.url;
        return true;
      } else {
        console.error('[CHECKOUT] No URL received from checkout session');
        throw new Error('Nie otrzymano URL sesji checkout');
      }
    } catch (edgeFunctionError) {
      // If edge function fails, try with Netlify function as fallback
      console.error('[CHECKOUT] Edge function failed, trying Netlify fallback:', edgeFunctionError);
      
      // Try Netlify fallback
      const netlifyUrl = `${window.location.protocol}//${window.location.host}/.netlify/functions/stripe-checkout`;
      
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
        const errorText = await response.text();
        console.error('[CHECKOUT] Netlify function error:', errorText);
        throw new Error(`Błąd podczas tworzenia sesji w fallback: ${response.status} ${errorText}`);
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
    
    // Clear session flags
    sessionStorage.removeItem('stripeCheckoutInProgress');
    sessionStorage.removeItem('redirectingToStripe');
    
    let errorMessage = error instanceof Error ? error.message : 'Nie można uruchomić procesu płatności';
    
    toast.error('Wystąpił błąd', {
      description: errorMessage
    });

    return false;
  }
};
