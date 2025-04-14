
import { toast } from 'sonner';
import { getStripe, PRICE_IDS } from './client';
import { supabase } from '@/integrations/supabase/client';

export const createCheckoutSession = async (priceId: string) => {
  try {
    console.log('Starting checkout process with priceId', priceId);
    
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
    const userEmail = localStorage.getItem('userEmail');
    
    // Ensure absolute URLs with full domain
    const fullOrigin = window.location.origin;
    const successUrl = `${fullOrigin}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${fullOrigin}/pricing?canceled=true`;

    console.log('Preparing checkout with params:', {
      priceId,
      userEmail: userEmail ? 'Email provided' : 'Not provided',
      userId: user.id,
      successUrl,
      cancelUrl
    });
    
    // Get Stripe instance
    const stripe = await getStripe();
    
    if (!stripe) {
      console.error('Failed to initialize Stripe');
      throw new Error('Nie można zainicjować systemu płatności');
    }
    
    console.log('Stripe initialized successfully, redirecting to checkout...');
    
    // Create a checkout session with user ID in metadata and client_reference_id
    const { error } = await stripe.redirectToCheckout({
      lineItems: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      successUrl,
      cancelUrl,
      customerEmail: userEmail || undefined,
      clientReferenceId: user.id, // Add user ID as client_reference_id
      metadata: {
        userId: user.id // Also add user ID to metadata for redundancy
      }
    });
    
    if (error) {
      console.error('Stripe checkout error:', error);
      throw new Error(error.message || 'Błąd podczas przekierowania do płatności');
    }
    
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
