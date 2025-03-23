
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
    
    // Get real site domain from current URL
    const currentDomain = window.location.hostname;
    const currentUrl = window.location.href;
    
    console.log('Running on domain:', currentDomain);
    console.log('Current URL:', currentUrl);

    // Clear any existing checkout flags
    sessionStorage.removeItem('stripeCheckoutInProgress');
    sessionStorage.removeItem('redirectingToStripe');
    
    // Set a new checkout flag with timestamp
    const timestamp = Date.now().toString();
    sessionStorage.setItem('stripeCheckoutInProgress', timestamp);
    
    toast.info('Rozpoczynam proces płatności', {
      duration: 3000,
    });
    
    // Try multiple approaches in sequence to maximize compatibility

    // First attempt: Try direct URL GET request with parameters
    try {
      console.log('ATTEMPT 1: Using GET request with URL parameters');
      
      // Determine the base URL for the function
      let baseUrl;
      if (currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1')) {
        baseUrl = 'http://localhost:8888/.netlify/functions/stripe-checkout';
      } else {
        // Use dynamically determined origin from where we're running
        baseUrl = `${fullOrigin}/.netlify/functions/stripe-checkout`;
      }
      
      // Add parameters to URL
      const url = new URL(baseUrl);
      url.searchParams.append('priceId', priceId);
      if (userEmail) {
        url.searchParams.append('customerEmail', userEmail);
      }
      url.searchParams.append('successUrl', successUrl);
      url.searchParams.append('cancelUrl', cancelUrl);
      url.searchParams.append('timestamp', timestamp);
      
      console.log('Making GET request to:', url.toString());
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('GET response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        if (data?.url) {
          console.log('GET request successful, redirecting to:', data.url);
          
          sessionStorage.setItem('redirectingToStripe', timestamp);
          window.location.assign(data.url);
          return true;
        }
      }
      
      console.log('GET request failed, trying POST method...');
    } catch (getError) {
      console.error('GET request attempt failed:', getError);
      console.log('Falling back to POST method...');
    }
    
    // Second attempt: Standard POST request
    let netlifyFunctionUrl;
    if (currentDomain.includes('localhost') || currentDomain.includes('127.0.0.1')) {
      netlifyFunctionUrl = 'http://localhost:8888/.netlify/functions/stripe-checkout';
    } else {
      netlifyFunctionUrl = `${fullOrigin}/.netlify/functions/stripe-checkout`;
    }
    
    console.log('ATTEMPT 2: Making POST request to:', netlifyFunctionUrl);

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
        timestamp
      })
    };
    
    const response = await fetch(netlifyFunctionUrl, requestParams);
    
    console.log('POST response status:', response.status);
    console.log('POST response headers:', Object.fromEntries([...response.headers.entries()]));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Function error response:', response.status, errorText);
      
      // Try the Supabase function as a last resort
      console.log('ATTEMPT 3: Switching to Supabase function for stripe checkout');
      
      // First try direct serverless function URL
      const supabaseFunctionUrl = `${fullOrigin}/functions/stripe-checkout`;
      console.log('Trying Supabase function URL:', supabaseFunctionUrl);
      
      try {
        toast.info('Próbuję alternatywną metodę płatności...');
        
        const supabaseResponse = await fetch(supabaseFunctionUrl, requestParams);
        
        if (!supabaseResponse.ok) {
          throw new Error(`Błąd funkcji zapasowej: ${supabaseResponse.status}`);
        }
        
        const responseData = await supabaseResponse.json();
        
        if (responseData?.url) {
          console.log('Received Stripe Checkout URL from Supabase function, redirecting to:', responseData.url);
          
          sessionStorage.setItem('redirectingToStripe', timestamp);
          
          toast.success('Przekierowujemy do strony płatności...');
          window.location.assign(responseData.url);
          return true;
        } else {
          throw new Error('Brak URL w odpowiedzi zapasowej');
        }
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        
        // As a last resort, try JSONP-style approach using iframe redirect
        console.log('ATTEMPT 4: Trying direct Stripe redirect');
        
        try {
          // Create a direct Stripe checkout session URL
          const stripeDirectUrl = `https://checkout.stripe.com/c/pay/${priceId}?success_url=${encodeURIComponent(successUrl)}&cancel_url=${encodeURIComponent(cancelUrl)}`;
          
          console.log('Attempting direct Stripe redirect to:', stripeDirectUrl);
          toast.info('Przekierowujemy do Stripe...');
          
          // Set timeout to avoid immediate redirect issues
          setTimeout(() => {
            window.location.assign(stripeDirectUrl);
          }, 1000);
          
          return true;
        } catch (directError) {
          console.error('Direct Stripe redirect also failed:', directError);
          throw new Error('Wszystkie metody płatności zawiodły. Spróbuj odświeżyć stronę lub skontaktuj się z obsługą.');
        }
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
      
      sessionStorage.setItem('redirectingToStripe', timestamp);
      
      toast.success('Przekierowujemy do strony płatności...');
      setTimeout(() => {
        window.location.assign(responseData.url);
      }, 1000);
      
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
