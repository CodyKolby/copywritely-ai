import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Pobieramy publiczny klucz ze zmiennych środowiskowych
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Inicjalizujemy Stripe
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise && stripePublicKey) {
    console.log('Initializing Stripe with public key:', stripePublicKey ? 'Available' : 'Missing');
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};

// Rzeczywiste ID cenników produktów ze Stripe
// Aktualizacja - używamy prawidłowego price ID w trybie testowym
export const PRICE_IDS = {
  PRO_MONTHLY: 'price_1R5A8aAGO17NLUWtxzthF8lo', // Correct test mode price ID
  PRO_ANNUAL: 'price_1R5A8aAGO17NLUWtxzthF8lo', // Using the same ID for testing
};

// Funkcja do tworzenia sesji Checkout
export const createCheckoutSession = async (priceId: string) => {
  // Store reference to the toast ID so we can dismiss it later
  let loadingToastId: string | number = '';
  
  // Setup timeout to prevent infinite loading
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Przekroczono czas oczekiwania na odpowiedź serwera')), 15000);
  });
  
  try {
    if (!priceId) {
      console.error('Missing priceId');
      throw new Error('Nieprawidłowy identyfikator cennika');
    }

    if (!stripePublicKey) {
      console.error('Missing Stripe public key');
      throw new Error('Brak klucza Stripe');
    }

    // Pobierz zapisany email użytkownika
    const userEmail = localStorage.getItem('userEmail');
    
    // Upewnijmy się, że używamy absolutnych URL-i z pełną domeną
    const fullOrigin = window.location.origin;
    
    // Generujemy kompletne, absolutne URL-e
    const successUrl = `${fullOrigin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${fullOrigin}/pricing?canceled=true`;

    // Pokazujemy toast informujący o rozpoczęciu procesu
    loadingToastId = toast.loading('Przygotowujemy proces płatności...');

    console.log('Starting Stripe checkout with:', {
      priceId,
      userEmail: userEmail ? 'Email provided' : 'Not provided',
      successUrl,
      cancelUrl,
      fullOrigin,
      hostname: window.location.hostname,
      environment: stripePublicKey.startsWith('pk_test_') ? 'TEST' : 'LIVE'
    });

    // Race the Supabase function call with a timeout
    const result = await Promise.race([
      supabase.functions.invoke('stripe-checkout', {
        body: {
          priceId,
          customerEmail: userEmail || undefined,
          successUrl,
          cancelUrl,
          origin: fullOrigin // Dodajemy pełny adres URL z protokołem i domeną
        }
      }),
      timeoutPromise
    ]);

    // Always dismiss the loading toast once we get a response
    if (loadingToastId) {
      toast.dismiss(loadingToastId);
    }

    const { data, error } = result;

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message || 'Błąd przy wywoływaniu funkcji Stripe');
    }

    // Jeśli funkcja zwróciła błąd w danych
    if (data?.error) {
      console.error('Stripe error:', data.error);
      throw new Error(data.error);
    }

    // Jeśli funkcja zwróciła URL, przekieruj użytkownika
    if (data?.url) {
      console.log('Redirecting to Stripe Checkout URL:', data.url);
      
      // Zamień toast ładowania na toast sukcesu
      toast.success('Przekierowujemy do strony płatności...');
      
      // Ustawiamy flagę, że przekierowujemy do Stripe - TERAZ WYŁĄCZNIE gdy faktycznie następuje przekierowanie
      sessionStorage.setItem('redirectingToStripe', 'true');
      
      // Dodajemy małe opóźnienie przed przekierowaniem, aby zminimalizować problemy z czasowaniem
      setTimeout(() => {
        window.location.href = data.url;
      }, 1000);
      
      return true;
    } else {
      throw new Error('Nie otrzymano poprawnej odpowiedzi z serwera');
    }
  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    // Always dismiss the loading toast if there's an error
    if (loadingToastId) {
      toast.dismiss(loadingToastId);
    }
    
    // Handle specific error messages
    let errorMessage = error instanceof Error ? error.message : 'Nie można uruchomić procesu płatności';
    
    // Check for timeout errors
    if (errorMessage.includes('czas oczekiwania')) {
      errorMessage = 'Przekroczono czas oczekiwania na odpowiedź serwera. Spróbuj ponownie później.';
    }
    // Check for common Stripe errors and provide more user-friendly messages
    else if (errorMessage.includes('Missing Stripe API key')) {
      errorMessage = 'Błąd konfiguracji: brak klucza API Stripe po stronie serwera';
    } else if (errorMessage.includes('Mode mismatch')) {
      errorMessage = 'Błąd konfiguracji: niezgodność pomiędzy trybem testowym i produkcyjnym';
    } else if (errorMessage.includes('Price ID error')) {
      errorMessage = 'Błąd: nieprawidłowy identyfikator produktu';
    }
    
    toast.error('Wystąpił błąd', {
      description: errorMessage
    });
    return false;
  }
};

// Interfejs dla danych subskrypcji
export interface SubscriptionDetails {
  subscriptionId: string;
  status: string;
  currentPeriodEnd: string;
  daysUntilRenewal: number;
  cancelAtPeriodEnd: boolean;
  portalUrl: string;
  hasSubscription: boolean;
  plan: string;
  trialEnd: string | null;
}

// Funkcja do pobierania szczegółów subskrypcji
export const getSubscriptionDetails = async (userId: string): Promise<SubscriptionDetails | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('subscription-details', {
      body: { userId }
    });
    
    if (error) {
      console.error('Error fetching subscription details:', error);
      return null;
    }
    
    return data as SubscriptionDetails;
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    return null;
  }
};

// Funkcja do anulowania subskrypcji
export const cancelSubscription = async (userId: string, subscriptionId: string): Promise<any> => {
  try {
    const { data, error } = await supabase.functions.invoke('cancel-subscription', {
      body: { userId, subscriptionId }
    });
    
    if (error) {
      console.error('Error canceling subscription:', error);
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
};

// Funkcja do sprawdzania statusu subskrypcji
export const checkSubscriptionStatus = async (userId: string): Promise<boolean> => {
  try {
    // Wywołaj funkcję edge do sprawdzenia statusu subskrypcji
    const { data, error } = await supabase.functions.invoke('check-subscription-status', {
      body: { userId }
    });
    
    if (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
    
    return data?.isPremium || false;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};
