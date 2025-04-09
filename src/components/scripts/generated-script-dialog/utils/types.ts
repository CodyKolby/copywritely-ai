
export interface PosthookResponse {
  hooks: string[];
  theme?: string;
  form?: string;
  cta?: string;
  version?: string;
  promptUsed?: string;
}

export interface PostscriptResponse {
  content: string;
  debugInfo?: {
    systemPromptUsed?: string;
    timestamp?: string;
    requestId?: string;
    promptVersion?: string;
  };
}

export interface ScriptGenerationResult {
  script: string;
  bestHook: string;
  allHooks?: string[];
  currentHookIndex: number;
  totalHooks: number;
  cta?: string;
  theme?: string;
  form?: string;
  adStructure?: string;
  rawResponse?: string;
  debugInfo?: any;
}
