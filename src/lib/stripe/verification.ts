
import { supabase } from '@/integrations/supabase/client';

// Weryfikacja klucza Stripe poprzez wywołanie funkcji Edge
export const verifyStripeKey = async (): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-stripe-key');
    
    if (error) {
      console.error('Błąd podczas weryfikacji klucza Stripe:', error);
      return { success: false, message: `Błąd: ${error.message || 'Nieznany błąd'}` };
    }
    
    return { 
      success: data.success, 
      message: data.message || 'Klucz zweryfikowany pomyślnie', 
      data 
    };
  } catch (error) {
    console.error('Wyjątek podczas weryfikacji klucza Stripe:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Nieznany błąd podczas weryfikacji' 
    };
  }
};

// Wymuszenie aktualizacji statusu premium dla użytkownika na podstawie sesji płatności
export const forceUpdatePremiumStatus = async (userId: string, sessionId: string | null = null): Promise<boolean> => {
  try {
    if (!userId) {
      console.error('Brak userId przy próbie aktualizacji statusu premium');
      return false;
    }
    
    console.log(`Aktualizowanie statusu premium dla użytkownika: ${userId}`);
    
    // Ustaw datę wygaśnięcia na 30 dni od teraz
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        is_premium: true,
        subscription_status: 'active',
        subscription_expiry: expiryDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (error) {
      console.error('Błąd podczas aktualizacji profilu:', error);
      return false;
    } 
    
    console.log('Status premium zaktualizowany pomyślnie');
    
    // Jeśli podano ID sesji, dodaj wpis do logów płatności
    if (sessionId) {
      try {
        const { error: logError } = await supabase
          .from('payment_logs')
          .insert({
            user_id: userId,
            session_id: sessionId,
            timestamp: new Date().toISOString()
          });
          
        if (logError) {
          console.error('Błąd podczas dodawania logu płatności:', logError);
          // Niepowodzenie logu nie wpływa na status operacji
        }
      } catch (logException) {
        console.error('Wyjątek podczas zapisywania logu:', logException);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Błąd podczas aktualizacji statusu premium:', error);
    return false;
  }
};
