
import type { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';
import { ScriptGenerationResult, PosthookResponse, PostscriptResponse } from './types';
import { supabase } from "@/integrations/supabase/client";

// Main function to generate script
export const generateScript = async (
  templateId: string,
  targetAudienceId: string,
  advertisingGoal: string = '',
  hookIndex: number = 0,
  socialMediaPlatform?: SocialMediaPlatform
): Promise<ScriptGenerationResult> => {
  try {
    console.log('Rozpoczęto generowanie skryptu:', {
      templateId,
      targetAudienceId,
      advertisingGoal,
      hookIndex,
      platform: socialMediaPlatform?.label || 'Meta'
    });

    // Add a strong cache-busting timestamp to prevent caching issues
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    const timestamp = new Date().toISOString();
    
    // Fetch the target audience data first
    const { data: targetAudience, error: audienceError } = await supabase
      .from('target_audiences')
      .select('*')
      .eq('id', targetAudienceId)
      .single();

    if (audienceError || !targetAudience) {
      console.error('Error fetching target audience:', audienceError);
      throw new Error(`Nie znaleziono grupy docelowej: ${audienceError?.message || 'Unknown error'}`);
    }

    console.log('Pobrano dane grupy docelowej:', targetAudience);

    // Get the access token
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token || '';
    
    if (!accessToken) {
      throw new Error('Użytkownik nie jest zalogowany.');
    }

    // Use the generate-script function for all templates
    return generateOnlineAdScript(
      targetAudience,
      advertisingGoal,
      hookIndex,
      templateId,
      accessToken
    );
  } catch (error: any) {
    console.error('Error generating script:', error);
    throw error;
  }
};

// Function for generating online ad scripts
async function generateOnlineAdScript(
  targetAudience: any,
  advertisingGoal: string,
  hookIndex: number,
  templateId: string,
  accessToken?: string
): Promise<ScriptGenerationResult> {
  console.log('Używam workflow dla reklam internetowych (PAS)');

  // Get a fresh access token
  const { data: { session } } = await supabase.auth.getSession();
  const freshAccessToken = session?.access_token || accessToken || '';

  if (!freshAccessToken) {
    throw new Error('Nie można uzyskać tokenu dostępu');
  }

  // Call the generate-script function
  const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const response = await fetch(`https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/generate-script?_nocache=${Date.now()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${freshAccessToken}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    body: JSON.stringify({
      templateId,
      targetAudienceId: targetAudience.id,
      advertisingGoal,
      hookIndex,
      debugInfo: true,
      cacheBuster
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Generate Script API error:', errorText);
    throw new Error(`Błąd podczas generowania skryptu: ${errorText}`);
  }

  const data = await response.json();
  console.log('Online Ad Script Generated Response:', {
    script: data.script?.substring(0, 50) + '...',
    hooks: data.allHooks ? data.allHooks.length : 0,
    hookIndex: data.currentHookIndex
  });

  return {
    script: data.script,
    bestHook: data.bestHook,
    allHooks: data.allHooks || [],
    currentHookIndex: data.currentHookIndex,
    totalHooks: data.allHooks ? data.allHooks.length : 0,
    adStructure: 'PAS',
    rawResponse: data.script,
    debugInfo: null
  };
}
