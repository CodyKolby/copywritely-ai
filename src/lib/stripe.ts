
import { loadStripe } from '@stripe/stripe-js';

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
  PRO_MONTHLY: 'price_1P3ASkG0KQWtMCjDnTvlSb27',
  PRO_ANNUAL: 'price_1P3AT7G0KQWtMCjD7bkvKKSt',
};

// Funkcja do tworzenia sesji Checkout
export const createCheckoutSession = async (priceId: string) => {
  const stripe = await getStripe();
  
  if (!stripe) {
    throw new Error('Nie udało się zainicjalizować Stripe');
  }
  
  // Przekieruj do Stripe Checkout
  const { error } = await stripe.redirectToCheckout({
    lineItems: [
      {
        price: priceId, // ID cennika z panelu Stripe
        quantity: 1,
      },
    ],
    mode: 'subscription',
    successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${window.location.origin}/pricing`,
    // Dodaj informacje o kliencie (opcjonalnie)
    customerEmail: localStorage.getItem('userEmail') || undefined,
  });

  if (error) {
    console.error('Wystąpił błąd podczas przekierowania do Stripe Checkout:', error);
    throw new Error(error.message);
  }
};

// Funkcja do sprawdzania statusu subskrypcji (do zaimplementowania z backendem)
export const checkSubscriptionStatus = async (userId: string): Promise<boolean> => {
  // W rzeczywistej implementacji, to powinno wywołać endpoint API,
  // który sprawdza status subskrypcji w bazie danych
  
  // Tymczasowa implementacja dla testów
  try {
    // Sprawdź czy użytkownik ma aktywną subskrypcję
    // W prawdziwej implementacji, sprawdź w Supabase lub przez API
    return false;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};
