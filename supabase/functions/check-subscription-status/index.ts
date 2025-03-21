
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.5.0";

// Pobieramy klucze ze zmiennych środowiskowych
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Definiujemy nagłówki CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Obsługa zapytań CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Pobieramy ID użytkownika z żądania
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('Brak userId');
    }

    // Tworzymy klienta Supabase z Service Role Key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Sprawdzamy status subskrypcji w tabeli profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_premium, subscription_status, subscription_expiry')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Błąd podczas pobierania profilu:', profileError);
      throw new Error('Nie udało się pobrać profilu użytkownika');
    }

    // Sprawdzamy czy subskrypcja jest aktywna
    let isPremium = false;
    
    if (profile) {
      // Jeśli mamy flagę is_premium i/lub datę wygaśnięcia subskrypcji
      isPremium = profile.is_premium || false;
      
      // Sprawdzamy datę wygaśnięcia, jeśli istnieje
      if (profile.subscription_expiry) {
        const expiryDate = new Date(profile.subscription_expiry);
        const now = new Date();
        
        // Jeśli data wygaśnięcia jest w przyszłości, użytkownik ma aktywną subskrypcję
        if (expiryDate > now) {
          isPremium = true;
        } else if (isPremium) {
          // Jeśli data wygaśnięcia jest w przeszłości, ale flaga is_premium jest true,
          // aktualizujemy status na false
          await supabase
            .from('profiles')
            .update({ is_premium: false })
            .eq('id', userId);
          
          isPremium = false;
        }
      }
      
      // Sprawdzamy status subskrypcji
      if (profile.subscription_status === 'active' || 
          profile.subscription_status === 'trialing') {
        isPremium = true;
      }
    }

    return new Response(
      JSON.stringify({ isPremium }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Błąd podczas sprawdzania statusu subskrypcji:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Wystąpił błąd podczas sprawdzania statusu subskrypcji',
        isPremium: false
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
