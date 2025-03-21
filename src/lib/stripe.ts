
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';

// Pobieramy publiczny klucz ze zmiennych środowiskowych
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Inicjalizujemy Stripe
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};

// Rzeczywiste ID cenników produktów ze Stripe
export const PRICE_IDS = {
  PRO_MONTHLY: 'price_1P3ASkG0KQWtMCjDnTvlSb27', // To będzie zastąpione prawdziwym ID cennika dla produktu prod_Rz7Lpm5vk4zmRY
  PRO_ANNUAL: 'price_1P3AT7G0KQWtMCjD7bkvKKSt', // To będzie zastąpione prawdziwym ID cennika dla produktu prod_Rz7MpFmtOEfxIb
};

// Funkcja do tworzenia sesji Checkout
export const createCheckoutSession = async (priceId: string) => {
  try {
    // Pobierz zapisany email użytkownika
    const userEmail = localStorage.getItem('userEmail');
    
    // Wygeneruj URL powrotu
    const successUrl = `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${window.location.origin}/pricing`;

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
      throw new Error(error.message);
    }

    // Jeśli funkcja zwróciła URL, przekieruj użytkownika
    if (data?.url) {
      window.location.href = data.url;
    } else {
      throw new Error('Nie otrzymano poprawnej odpowiedzi z serwera');
    }
  } catch (error) {
    console.error('Wystąpił błąd podczas przekierowania do Stripe Checkout:', error);
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
