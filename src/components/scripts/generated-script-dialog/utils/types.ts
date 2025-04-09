
// Types for PostHook response
export interface PosthookResponse {
  hooks: string[];
  theme?: string;
  form?: string;
  cta?: string;
}

// Types for PostScript response
export interface PostscriptResponse {
  content: string;
  rawResponse?: string;
  debugInfo?: any;
}

// Type for saved project
export interface SavedProject {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

// Type for script generation result
export interface ScriptGenerationResult {
  script: string;
  bestHook: string;
  allHooks: string[];
  currentHookIndex: number;
  totalHooks: number;
  adStructure: string;
  cta?: string;
  theme?: string;
  form?: string;
  rawResponse?: string;
  debugInfo?: any;
}
