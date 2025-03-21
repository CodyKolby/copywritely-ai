
import { loadStripe } from '@stripe/stripe-js';

// Pobieramy publiczny klucz ze zmiennych środowiskowych
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51OtvALG0KQWtMCjDDpPlM4C2Gm2MUbZb3O8ZkDTkKCU6Dsk4NQe7EDc9l6XmLhB2Ll9x9pXnLDTWVF8kPmtxEWGh00uzNZCIMh';

// Inicjalizujemy Stripe
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};

// Funkcja do tworzenia sesji Checkout
export const createCheckoutSession = async (priceId: string) => {
  const stripe = await getStripe();
  
  // W prawdziwej implementacji, ten obiekt powinien pochodzić z backendu
  // aby zabezpieczyć proces płatności, ale na potrzeby demonstracji
  // tworzymy go tutaj
  
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
  });

  if (error) {
    console.error('Wystąpił błąd podczas przekierowania do Stripe Checkout:', error);
  }
};
