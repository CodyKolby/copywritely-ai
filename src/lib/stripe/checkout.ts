
import { toast } from 'sonner';
import { PRICE_IDS } from './client';

// Function to create checkout session
export const createCheckoutSession = async (priceId: string) => {
  try {
    console.log('Starting checkout process with priceId', priceId);
    console.log('Actual priceId value:', priceId);
    
    // Basic validation
    if (!priceId) {
      throw new Error('Nieprawidłowy identyfikator cennika');
    }

    // Get stored user email
    const userEmail = localStorage.getItem('userEmail');
    
    // Ensure absolute URLs with full domain
    const fullOrigin = window.location.origin;
    const successUrl = `${fullOrigin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${fullOrigin}/pricing?canceled=true`;

    console.log('Preparing checkout with params:', {
      priceId,
      userEmail: userEmail ? 'Email provided' : 'Not provided',
      successUrl,
      cancelUrl,
      origin: fullOrigin
    });
    
    // Clear any existing checkout flags
    sessionStorage.removeItem('stripeCheckoutInProgress');
    sessionStorage.removeItem('redirectingToStripe');
    
    // Set a new checkout flag with timestamp
    const timestamp = Date.now().toString();
    sessionStorage.setItem('stripeCheckoutInProgress', timestamp);
    
    toast.info('Rozpoczynam proces płatności', {
      duration: 3000,
    });
    
    // Try using Supabase function first - more reliable
    console.log('ATTEMPT 1: Using Supabase function for stripe checkout');
    const supabaseFunctionUrl = `${fullOrigin}/functions/stripe-checkout`;
    console.log('Trying Supabase function URL:', supabaseFunctionUrl);
    
    const requestParams = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store',
      },
      body: JSON.stringify({
        priceId,
        customerEmail: userEmail || undefined,
        successUrl,
        cancelUrl,
        origin: fullOrigin,
        timestamp
      })
    };
    
    try {
      const supabaseResponse = await fetch(supabaseFunctionUrl, requestParams);
      console.log('Supabase function response status:', supabaseResponse.status);
      
      if (supabaseResponse.ok) {
        const responseData = await supabaseResponse.json();
        console.log('Supabase function response data:', responseData);
        
        if (responseData?.url) {
          console.log('Received Stripe Checkout URL from Supabase function, redirecting to:', responseData.url);
          
          sessionStorage.setItem('redirectingToStripe', timestamp);
          
          toast.success('Przekierowujemy do strony płatności...');
          window.location.assign(responseData.url);
          return true;
        }
      } else {
        // If Supabase function failed, log the error
        const errorText = await supabaseResponse.text();
        console.error('Supabase function error:', errorText);
      }
    } catch (supabaseError) {
      console.error('Supabase function call failed:', supabaseError);
    }

    // Fall back to Netlify function
    console.log('ATTEMPT 2: Falling back to Netlify function');
    const netlifyFunctionUrl = `${fullOrigin}/.netlify/functions/stripe-checkout`;
    console.log('Calling Netlify function URL:', netlifyFunctionUrl);
    
    const netlifyResponse = await fetch(netlifyFunctionUrl, requestParams);
    console.log('Netlify function response status:', netlifyResponse.status);
    
    if (netlifyResponse.ok) {
      const responseData = await netlifyResponse.json();
      console.log('Netlify function response data:', responseData);
      
      if (responseData?.url) {
        console.log('Received Stripe Checkout URL from Netlify function, redirecting to:', responseData.url);
        
        sessionStorage.setItem('redirectingToStripe', timestamp);
        
        toast.success('Przekierowujemy do strony płatności...');
        window.location.assign(responseData.url);
        return true;
      }
    } else {
      const errorText = await netlifyResponse.text();
      console.error('Netlify function error:', errorText);
    }
    
    // As a last resort, try direct Stripe redirect
    console.log('ATTEMPT 3: Trying direct Stripe redirect');
    const checkoutPageUrl = `https://checkout.stripe.com/pay/${priceId}`;
    console.log('Direct Stripe URL:', checkoutPageUrl);
    
    toast.info('Próbuję bezpośrednie przekierowanie do Stripe...');
    setTimeout(() => {
      window.location.assign(checkoutPageUrl);
    }, 1000);
    return true;
    
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
