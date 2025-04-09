
import { supabase } from "@/lib/supabase";

// Helper function to fetch target audience details
export async function fetchTargetAudience(audienceId: string) {
  try {
    console.log(`Fetching target audience with ID: ${audienceId}`);
    
    const { data, error } = await supabase
      .from('target_audiences')
      .select('*')
      .eq('id', audienceId)
      .single();

    if (error) throw error;
    
    console.log("Target audience fetched successfully:", data ? "yes" : "no");
    return data;
  } catch (error) {
    console.error('Error fetching target audience:', error);
    throw new Error('Failed to fetch target audience data');
  }
}
