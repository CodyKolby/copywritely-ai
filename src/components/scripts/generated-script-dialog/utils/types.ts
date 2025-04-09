
import { SocialMediaPlatform } from '../../SocialMediaPlatformDialog';

// Define a consistent return type for all script generation functions
export interface ScriptGenerationResult {
  script: string;
  bestHook: string;
  allHooks: string[];
  currentHookIndex: number;
  totalHooks: number;
  adStructure: string;
  rawResponse?: string;
  debugInfo?: any;
  // Optional properties for social media posts
  cta?: string;
  theme?: string;
  form?: string;
}

export interface PosthookResponse {
  hooks: string[];
  theme?: string;
  cta?: string;
  form?: string;
}

export interface PostscriptResponse {
  content: string;
  rawResponse?: string;
  debugInfo?: any;
}
