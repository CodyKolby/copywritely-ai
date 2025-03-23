
import { toast } from 'sonner';
import { PRICE_IDS } from './client';

// Function to create checkout session
export const createCheckoutSession = async (priceId: string) => {
  try {
    console.log('Starting checkout process with priceId', priceId);
    
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
      cancelUrl
    });
    
    // Clear any existing checkout flags - ALWAYS do this first
    sessionStorage.removeItem('stripeCheckoutInProgress');
    sessionStorage.removeItem('redirectingToStripe');
    
    // Set a new checkout flag with timestamp
    const timestamp = Date.now().toString();
    sessionStorage.setItem('stripeCheckoutInProgress', timestamp);
    
    toast.info('Rozpoczynam proces płatności', {
      duration: 3000,
    });
    
    // Get domain from current URL
    const currentDomain = window.location.hostname;
    const currentProtocol = window.location.protocol;
    
    // Special handling to use either deployed Netlify functions or local dev setup
    let netlifyFunctionUrl = '';
    
    if (currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1')) {
      // Local development
      netlifyFunctionUrl = 'http://localhost:8888/.netlify/functions/stripe-checkout';
      console.log('Using local Netlify function URL');
    } else {
      // Production - construct full URL with current origin
      netlifyFunctionUrl = `${fullOrigin}/.netlify/functions/stripe-checkout`;
      console.log('Using production Netlify function URL:', netlifyFunctionUrl);
    }
    
    console.log('Calling Netlify function: stripe-checkout');
    console.log('Making POST request to:', netlifyFunctionUrl);

    // Enhanced error handling for fetch
    const requestParams = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({
        priceId,
        customerEmail: userEmail || undefined,
        successUrl,
        cancelUrl,
        timestamp // Include timestamp to prevent caching
      })
    };
    
    console.log('Request parameters:', {
      method: requestParams.method,
      headers: requestParams.headers
    });
    
    // Improved fetch with better error handling
    const response = await fetch(netlifyFunctionUrl, requestParams);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
    
    // Handle non-200 responses with detailed logging
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Function error response:', response.status, errorText);
      
      // Special handling for 405 errors
      if (response.status === 405) {
        console.error('405 Method Not Allowed error details:', {
          requestMethod: requestParams.method,
          responseHeaders: Object.fromEntries([...response.headers.entries()]),
          fullUrl: netlifyFunctionUrl
        });
        
        // Fallback to Supabase function if available
        try {
          toast.info('Próbuję alternatywną metodę płatności...');
          
          // Use Supabase function instead
          console.log('Switching to Supabase function for stripe checkout');
          const supabaseFunctionUrl = `${fullOrigin}/functions/stripe-checkout`;
          
          const supabaseResponse = await fetch(supabaseFunctionUrl, requestParams);
          
          if (!supabaseResponse.ok) {
            throw new Error(`Błąd funkcji zapasowej: ${supabaseResponse.status}`);
          }
          
          const responseData = await supabaseResponse.json();
          
          if (responseData?.url) {
            console.log('Received Stripe Checkout URL from fallback, redirecting to:', responseData.url);
            
            // Set redirect flag
            sessionStorage.setItem('redirectingToStripe', timestamp);
            
            toast.success('Przekierowujemy do strony płatności...');
            
            // Use setTimeout to avoid MutationObserver errors
            setTimeout(() => {
              window.location.assign(responseData.url);
            }, 1500);
            
            return true;
          } else {
            throw new Error('Brak URL w odpowiedzi zapasowej');
          }
        } catch (fallbackError) {
          console.error('Fallback method also failed:', fallbackError);
          throw new Error(`Błąd metody HTTP: 405 - Method Not Allowed. Spróbuj odświeżyć stronę lub skontaktuj się z obsługą techniczną.`);
        }
      } else {
        throw new Error(`Błąd serwera: ${response.status} ${errorText}`);
      }
    }
    
    // Parse response JSON
    let responseData;
    try {
      responseData = await response.json();
      console.log('Function successful response:', responseData);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      throw new Error('Nieprawidłowa odpowiedź z serwera płatności');
    }
    
    // If function returned a URL, redirect user
    if (responseData?.url) {
      console.log('Received Stripe Checkout URL, redirecting to:', responseData.url);
      
      // Set redirect flag
      sessionStorage.setItem('redirectingToStripe', timestamp);
      
      toast.success('Przekierowujemy do strony płatności...');
      
      // Use setTimeout to avoid MutationObserver errors
      setTimeout(() => {
        window.location.assign(responseData.url);
      }, 1500);
      
      return true;
    } else {
      console.error('No URL in response:', responseData);
      toast.error('Brak URL', { description: 'Nie otrzymano poprawnej odpowiedzi z serwera' });
      throw new Error('Nie otrzymano poprawnej odpowiedzi z serwera');
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
