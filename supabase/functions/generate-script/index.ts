
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateId, targetAudience } = await req.json();
    
    if (!templateId || !targetAudience) {
      return new Response(
        JSON.stringify({ error: 'Template ID and target audience are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating script for template:', templateId);
    console.log('Target audience data:', targetAudience);

    // Format audience data for the prompt
    const audienceDetails = formatAudienceDetails(targetAudience);
    
    // Select the appropriate system prompt based on template type
    const systemPrompt = getSystemPromptForTemplate(templateId);
    
    // Create the prompt for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: audienceDetails }
    ];

    console.log('Sending request to OpenAI');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Error generating script', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const generatedScript = data.choices[0].message.content;

    console.log('Script generated successfully');
    
    return new Response(
      JSON.stringify({ script: generatedScript }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-script function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper functions
function formatAudienceDetails(audience) {
  if (!audience) return "No target audience details provided.";
  
  let details = "# Target Audience Information\n\n";
  
  // Basic demographics
  if (audience.age_range) details += `Age Range: ${audience.age_range}\n`;
  if (audience.gender) details += `Gender: ${audience.gender}\n\n`;
  
  // Main offer
  if (audience.main_offer) details += `## Main Offer\n${audience.main_offer}\n\n`;
  
  // Offer details
  if (audience.offer_details) details += `## Offer Details\n${audience.offer_details}\n\n`;
  
  // Pains
  if (audience.pains && audience.pains.length > 0) {
    details += "## Customer Pains/Problems\n";
    audience.pains.forEach((pain, index) => {
      if (pain) details += `${index + 1}. ${pain}\n`;
    });
    details += "\n";
  }
  
  // Desires
  if (audience.desires && audience.desires.length > 0) {
    details += "## Customer Desires\n";
    audience.desires.forEach((desire, index) => {
      if (desire) details += `${index + 1}. ${desire}\n`;
    });
    details += "\n";
  }
  
  // Benefits
  if (audience.benefits && audience.benefits.length > 0) {
    details += "## Product/Service Benefits\n";
    audience.benefits.forEach((benefit, index) => {
      if (benefit) details += `${index + 1}. ${benefit}\n`;
    });
    details += "\n";
  }
  
  // Language
  if (audience.language) details += `## Customer Language\n${audience.language}\n\n`;
  
  // Beliefs
  if (audience.beliefs) details += `## Beliefs to Establish\n${audience.beliefs}\n\n`;
  
  // Biography
  if (audience.biography) details += `## Customer Biography\n${audience.biography}\n\n`;
  
  // Competitors
  if (audience.competitors && audience.competitors.length > 0) {
    details += "## Competitors\n";
    audience.competitors.forEach((competitor, index) => {
      if (competitor) details += `${index + 1}. ${competitor}\n`;
    });
    details += "\n";
  }
  
  // Why it works
  if (audience.why_it_works) details += `## Why Product/Service Works\n${audience.why_it_works}\n\n`;
  
  // Experience
  if (audience.experience) details += `## Seller Experience\n${audience.experience}\n\n`;
  
  return details;
}

function getSystemPromptForTemplate(templateId) {
  const basePrompt = "You are an expert copywriter specialized in creating compelling marketing scripts. ";
  
  switch(templateId) {
    case 'email':
      return basePrompt + 
        "Create a persuasive marketing email script that will convert leads into customers. " +
        "Structure the email with a compelling subject line, engaging opening, clear value proposition, " +
        "social proof, strong call-to-action, and professional signature. " +
        "Focus on benefits rather than features and maintain a conversational tone. " +
        "Format the output with clear sections including Subject Line, Preview Text, and Body Content. " +
        "The script should be between 300-500 words.";
    
    case 'social':
      return basePrompt + 
        "Create engaging social media post scripts optimized for the target audience. " +
        "Each post should have a hook, value proposition, and clear call-to-action. " +
        "Provide 3 variations for different platforms (Facebook, Instagram, LinkedIn) " +
        "with appropriate hashtags and formatting. Keep posts concise - Instagram/Facebook " +
        "around 125 words, LinkedIn around 200 words. Include emoji suggestions where appropriate.";
    
    case 'ad':
      return basePrompt + 
        "Create a high-converting digital advertisement script with attention-grabbing headlines, " +
        "compelling body copy, and strong call-to-action. The ad should address customer pain points " +
        "and highlight key benefits. Provide 3 headline options, 2 body copy variations, and 2 CTA options. " +
        "Keep the copy concise and impactful, with headlines under 10 words and body copy under 50 words.";
    
    default:
      return basePrompt + 
        "Create a well-structured marketing script that addresses customer pain points, " +
        "highlights benefits, includes social proof, and ends with a clear call-to-action. " +
        "The script should be persuasive, conversational, and tailored specifically to the target audience.";
  }
}
