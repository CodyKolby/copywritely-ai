
import type { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';
import { ScriptGenerationResult } from '../types';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

// Helper for retry logic
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    // First check if device is online
    if (!navigator.onLine) {
      toast.error('Brak połączenia z internetem', {
        description: 'Sprawdź połączenie internetowe i spróbuj ponownie'
      });
      throw new Error('Brak połączenia z internetem');
    }

    // Add a strong cache-busting timestamp to prevent caching issues
    const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    
    // Fetch the target audience data first
    let targetAudience = null;
    let audienceError = null;
    
    // Try up to 3 times with exponential backoff
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { data, error } = await supabase
          .from('target_audiences')
          .select('*')
          .eq('id', targetAudienceId)
          .single()
          .timeout(10000); // 10 second timeout
          
        if (error) {
          console.error(`Error fetching target audience (attempt ${attempt}/3):`, error);
          audienceError = error;
          
          if (attempt < 3) {
            const backoff = Math.min(1000 * Math.pow(2, attempt), 8000);
            console.log(`Retrying audience fetch in ${backoff}ms...`);
            await delay(backoff);
            continue;
          }
        } else if (data) {
          targetAudience = data;
          break;
        }
      } catch (fetchError) {
        console.error(`Exception fetching target audience (attempt ${attempt}/3):`, fetchError);
        
        if (attempt < 3) {
          const backoff = Math.min(1000 * Math.pow(2, attempt), 8000);
          await delay(backoff);
          continue;
        }
        
        audienceError = fetchError;
      }
    }

    if (!targetAudience) {
      const errorMessage = audienceError?.message || 'Unknown error';
      toast.error('Błąd pobierania danych grupy docelowej', {
        description: 'Spróbuj ponownie za chwilę'
      });
      throw new Error(`Nie znaleziono grupy docelowej: ${errorMessage}`);
    }

    console.log('Pobrano dane grupy docelowej:', targetAudience);

    // Get the access token
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token || '';
    
    if (!accessToken) {
      toast.error('Użytkownik nie jest zalogowany');
      throw new Error('Użytkownik nie jest zalogowany.');
    }

    // Use template specific generators
    if (templateId === 'social') {
      return generateSocialMedia(
        targetAudience,
        advertisingGoal,
        socialMediaPlatform,
        accessToken
      );
    } else {
      // Default to online ad script for other templates
      return generateOnlineAdScript(
        targetAudience,
        advertisingGoal,
        hookIndex,
        templateId,
        accessToken
      );
    }
  } catch (error: any) {
    console.error('Error generating script:', error);
    throw error;
  }
};

// Function for generating social media posts
async function generateSocialMedia(
  targetAudience: any,
  advertisingGoal: string,
  socialMediaPlatform?: SocialMediaPlatform,
  accessToken?: string
): Promise<ScriptGenerationResult> {
  console.log('Używam workflow dla postów na social media');
  
  // Get a fresh access token
  const { data: { session } } = await supabase.auth.getSession();
  const freshAccessToken = session?.access_token || accessToken || '';

  if (!freshAccessToken) {
    throw new Error('Nie można uzyskać tokenu dostępu');
  }

  const platform = socialMediaPlatform?.label || 'Meta (Facebook/Instagram)';
  const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  try {
    // Show a toast to indicate processing is happening
    toast.loading('Generowanie posta na social media...', {
      id: 'generating-social',
      duration: 10000
    });
    
    // Step 1: Generate intro with social-intro-agent
    console.log('Generowanie intro dla postu na platformę:', platform);
    
    let introResponse = null;
    let introRetries = 0;
    
    while (introRetries < 3) {
      try {
        introResponse = await fetch(`https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/social-intro-agent?_nocache=${cacheBuster}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${freshAccessToken}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
          body: JSON.stringify({
            targetAudience,
            advertisingGoal,
            platform,
            cacheBuster
          }),
          // Set a 20 second timeout on the request
          signal: AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined
        });
        
        // Successfully made request, break out of retry loop
        break;
      } catch (error) {
        console.error(`Social intro API error (attempt ${introRetries + 1}/3):`, error);
        introRetries++;
        
        if (introRetries >= 3) {
          toast.dismiss('generating-social');
          toast.error('Błąd podczas generowania intro', {
            description: 'Sprawdź połączenie i spróbuj ponownie'
          });
          throw new Error(`Błąd podczas generowania intro: ${error}`);
        }
        
        // Exponential backoff before retrying
        const backoff = Math.min(1000 * Math.pow(2, introRetries), 8000);
        console.log(`Retrying intro generation in ${backoff}ms...`);
        await delay(backoff);
      }
    }
    
    if (!introResponse || !introResponse.ok) {
      toast.dismiss('generating-social');
      const errorText = introResponse ? await introResponse.text() : 'Network error';
      console.error('Social Intro API error:', errorText);
      toast.error('Błąd podczas generowania intro', {
        description: 'Sprawdź połączenie z internetem i spróbuj ponownie'
      });
      throw new Error(`Błąd podczas generowania intro: ${errorText}`);
    }
    
    const introData = await introResponse.json();
    const generatedIntro = introData.intro;
    
    console.log('Wygenerowano intro:', generatedIntro.substring(0, 50) + '...');
    toast.dismiss('generating-social');
    toast.loading('Generowanie treści postu...', { 
      id: 'generating-post',
      duration: 20000
    });
    
    // Step 2: Generate the full post with social-post-agent
    console.log('Generowanie pełnej treści postu na platformę:', platform);
    
    let postResponse = null;
    let postRetries = 0;
    
    while (postRetries < 3) {
      try {
        postResponse = await fetch(`https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/social-post-agent?_nocache=${cacheBuster}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${freshAccessToken}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
          body: JSON.stringify({
            targetAudience,
            advertisingGoal,
            intro: generatedIntro,
            platform,
            cacheBuster
          }),
          // Set a 30 second timeout on the request
          signal: AbortSignal.timeout ? AbortSignal.timeout(30000) : undefined
        });
        
        // Successfully made request, break out of retry loop
        break;
      } catch (error) {
        console.error(`Social post API error (attempt ${postRetries + 1}/3):`, error);
        postRetries++;
        
        if (postRetries >= 3) {
          toast.dismiss('generating-post');
          toast.error('Błąd podczas generowania pełnego postu', {
            description: 'Sprawdź połączenie i spróbuj ponownie'
          });
          throw new Error(`Błąd podczas generowania pełnego postu: ${error}`);
        }
        
        // Exponential backoff before retrying
        const backoff = Math.min(2000 * Math.pow(2, postRetries), 10000);
        console.log(`Retrying post generation in ${backoff}ms...`);
        await delay(backoff);
      }
    }
    
    toast.dismiss('generating-post');
    
    if (!postResponse || !postResponse.ok) {
      const errorText = postResponse ? await postResponse.text() : 'Network error';
      console.error('Social Post API error:', errorText);
      toast.error('Błąd podczas generowania pełnego postu', {
        description: 'Spróbuj ponownie za chwilę'
      });
      throw new Error(`Błąd podczas generowania pełnego postu: ${errorText}`);
    }
    
    const postData = await postResponse.json();
    // Use the content field that contains only the post part without the intro
    const postContent = postData.content || '';
    // Use the full post that contains both the intro and content
    const fullPost = postData.post || '';
    
    console.log('Wygenerowano pełny post:', fullPost.substring(0, 50) + '...');
    console.log('Wygenerowano treść postu (bez intro):', postContent.substring(0, 50) + '...');
    
    toast.success('Wygenerowano post na social media', {
      description: `Platforma: ${platform}`
    });
    
    return {
      script: fullPost,
      bestHook: generatedIntro,
      allHooks: [generatedIntro],
      currentHookIndex: 0,
      totalHooks: 1,
      adStructure: 'social',
      rawResponse: postContent,
      debugInfo: null
    };
  } catch (error) {
    console.error('Error generating social media post:', error);
    toast.dismiss('generating-social');
    toast.dismiss('generating-post');
    toast.error('Błąd generowania postu', {
      description: 'Sprawdź połączenie z internetem i spróbuj ponownie'
    });
    throw error;
  }
}

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

  toast.loading('Generowanie skryptu reklamowego...', {
    id: 'generating-script',
    duration: 30000 // 30 seconds timeout for UI
  });

  // Call the generate-script function with retry logic
  const cacheBuster = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  let response = null;
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      response = await fetch(`https://jorbqjareswzdrsmepbv.supabase.co/functions/v1/generate-script?_nocache=${Date.now()}`, {
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
        // Set a longer timeout for this request since it can take time
        signal: AbortSignal.timeout ? AbortSignal.timeout(40000) : undefined
      });
      
      // Successfully made request, break out of retry loop
      break;
    } catch (error) {
      console.error(`Generate script API error (attempt ${retryCount + 1}/${maxRetries}):`, error);
      retryCount++;
      
      if (retryCount >= maxRetries) {
        toast.dismiss('generating-script');
        toast.error('Błąd podczas generowania skryptu', {
          description: 'Sprawdź połączenie i spróbuj ponownie'
        });
        throw new Error(`Błąd podczas generowania skryptu: ${error}`);
      }
      
      // Exponential backoff before retrying
      const backoff = Math.min(2000 * Math.pow(2, retryCount), 10000);
      console.log(`Retrying script generation in ${backoff}ms...`);
      await delay(backoff);
    }
  }

  toast.dismiss('generating-script');

  if (!response || !response.ok) {
    const errorText = response ? await response.text() : 'Network error';
    console.error('Generate Script API error:', errorText);
    toast.error('Błąd podczas generowania skryptu', {
      description: 'Spróbuj ponownie za chwilę'
    });
    throw new Error(`Błąd podczas generowania skryptu: ${errorText}`);
  }

  const data = await response.json();
  console.log('Online Ad Script Generated Response:', {
    script: data.script?.substring(0, 50) + '...',
    hooks: data.allHooks ? data.allHooks.length : 0,
    hookIndex: data.currentHookIndex
  });
  
  toast.success('Skrypt reklamowy wygenerowany pomyślnie');

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
