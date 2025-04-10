
import { SocialMediaPlatform } from '../SocialMediaPlatformDialog';
import { SocialHookResponse } from './services/social-hook-service';

export interface UseSocialGenerationProps {
  open: boolean;
  targetAudienceId: string;
  templateId: string;
  advertisingGoal?: string;
  platform?: SocialMediaPlatform;
  userId?: string;
}

export interface SocialGenerationHookReturn {
  isLoading: boolean;
  error: string | null;
  generatedContent: string;
  isGeneratingNewContent: boolean;
  isSaving: boolean;
  projectSaved: boolean;
  projectId: string | null;
  hookResponse: SocialHookResponse | null;
  handleRetry: () => void;
  saveToProject: () => Promise<void>;
  handleViewProject: () => void;
  setGeneratedContent: (content: string) => void;
}
