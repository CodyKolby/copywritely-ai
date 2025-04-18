
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

export interface SavedProject {
  id: string;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  type?: string;
  platform?: string;
  subject?: string;
  alternativeSubject?: string;
}

export interface GeneratedScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetAudienceId: string;
  templateId: string;
  advertisingGoal?: string;
  socialMediaPlatform?: {
    key: string;
    label: string;
  };
}
