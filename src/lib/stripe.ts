
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
// Aktualizacja - używamy cen testowych
export const PRICE_IDS = {
  PRO_MONTHLY: 'price_1OtvALG0KQWtMCjDDpPlM4C2', // Updated test mode price ID
  PRO_ANNUAL: 'price_1OtvALG0KQWtMCjDDpPlM4C2', // Using the same ID for annual for testing
};

// Funkcja do tworzenia sesji Checkout
export const createCheckoutSession = async (priceId: string) => {
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
    
    // Wygeneruj URL powrotu
    const successUrl = `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${window.location.origin}/pricing`;

    // Pokazujemy toast informujący o rozpoczęciu procesu
    toast.info('Przygotowujemy proces płatności...');

    console.log('Starting Stripe checkout with:', {
      priceId,
      userEmail: userEmail ? 'Email provided' : 'Not provided',
      successUrl,
      cancelUrl,
      environment: stripePublicKey.startsWith('pk_test_') ? 'TEST' : 'LIVE'
    });

    // Wywołaj funkcję edge w Supabase
    const { data, error } = await supabase.functions.invoke('stripe-checkout', {
      body: {
        priceId,
        customerEmail: userEmail || undefined,
        successUrl,
        cancelUrl
      }
    });

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
      window.location.href = data.url;
    } else {
      throw new Error('Nie otrzymano poprawnej odpowiedzi z serwera');
    }
  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    // Handle specific error messages
    let errorMessage = error instanceof Error ? error.message : 'Nie można uruchomić procesu płatności';
    
    // Check for common Stripe errors and provide more user-friendly messages
    if (errorMessage.includes('Missing Stripe API key')) {
      errorMessage = 'Błąd konfiguracji: brak klucza API Stripe po stronie serwera';
    } else if (errorMessage.includes('Mode mismatch')) {
      errorMessage = 'Błąd konfiguracji: niezgodność pomiędzy trybem testowym i produkcyjnym';
    } else if (errorMessage.includes('Price ID error')) {
      errorMessage = 'Błąd: nieprawidłowy identyfikator produktu';
    }
    
    toast.error('Wystąpił błąd', {
      description: errorMessage
    });
    throw error;
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
