
import { SocialHookResponse } from './services/social-hook-service';
import { SocialMediaPlatform } from '../SocialMediaPlatformDialog';

export interface UseSocialGenerationProps {
  open: boolean;
  targetAudienceId: string;
  templateId: string;
  advertisingGoal: string;
  platform?: SocialMediaPlatform;
  userId?: string;
}

export interface SocialGenerationState {
  isLoading: boolean;
  error: string | null;
  generatedHooks: string[];
  selectedHookIndex: number;
  currentHook: string;
  generatedContent: string;
  isSaving: boolean;
  projectSaved: boolean;
  projectId: string | null;
  hookResponse: SocialHookResponse | null;
  totalHooks: number;
  isGeneratingNewContent: boolean;
}

export interface SocialGenerationActions {
  selectHook: (index: number) => void;
  handleRetry: () => void;
  saveToProject: () => void;
  handleViewProject: () => void;
  setGeneratedContent: (content: string) => void;
  generateWithNextHook: () => Promise<void>;
}

export type SocialGenerationHookReturn = SocialGenerationState & SocialGenerationActions & {
  debugInfo: any;
};
