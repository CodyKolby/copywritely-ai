
import type { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';

export interface PosthookResponse {
  hooks: string[];
  theme: string;
  form?: string;
  cta?: string;
}

export interface PostscriptResponse {
  content: string;
  rawResponse?: string;
  debugInfo?: any;
}

export interface ScriptGenerationResult {
  script: string;
  bestHook: string;
  allHooks?: string[];
  currentHookIndex?: number;
  totalHooks?: number;
  theme?: string;
  form?: string;
  cta?: string;
  adStructure?: string;
  rawResponse?: string;
  debugInfo?: any;
}

export interface SavedProject {
  id: string;
  title: string;
  content: string;
  created_at: string;
}
