
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Run diagnostics on a user account and try to fix any issues
 */
export const diagnoseAndFixUserAccount = async (userId: string) => {
  if (!userId) {
    console.error('[DIAGNOSTICS] No user ID provided for diagnostics');
    return {
      success: false,
      message: 'No user ID provided'
    };
  }
  
  try {
    console.log('[DIAGNOSTICS] Running diagnostics for user:', userId);
    toast.info('Uruchamianie diagnostyki konta...');
    
    const { data, error } = await supabase.functions.invoke('diagnose-user-data', {
      body: { userId }
    });
    
    if (error) {
      console.error('[DIAGNOSTICS] Error invoking diagnostics:', error);
      toast.error('Błąd podczas diagnostyki konta', { 
        description: 'Spróbuj ponownie później lub skontaktuj się z obsługą' 
      });
      
      return {
        success: false,
        message: 'Error invoking diagnostics',
        error
      };
    }
    
    console.log('[DIAGNOSTICS] Diagnostics results:', data);
    
    // Show results to user
    if (data.fixes && data.fixes.success) {
      toast.success('Naprawiono problemy z kontem', {
        description: `Zastosowano ${data.fixes.fixes.length} poprawek`
      });
    } else if (data.diagnostics && data.diagnostics.problems.length > 0) {
      toast.warning('Wykryto problemy z kontem', {
        description: `Wykryto ${data.diagnostics.problems.length} problemów`
      });
    } else {
      toast.success('Konto działa poprawnie', {
        description: 'Nie wykryto żadnych problemów'
      });
    }
    
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('[DIAGNOSTICS] Exception running diagnostics:', error);
    toast.error('Wystąpił błąd podczas diagnostyki konta');
    
    return {
      success: false,
      message: 'Exception running diagnostics',
      error
    };
  }
};
