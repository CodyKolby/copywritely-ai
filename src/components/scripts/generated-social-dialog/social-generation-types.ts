
import { SocialHookResponse } from './services/social-hook-service';
import { SocialMediaPlatform } from '../SocialMediaPlatformDialog';

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
  isSaving: boolean;
  projectSaved: boolean;
  projectId: string | null;
  hookResponse: SocialHookResponse | null;
  isGeneratingNewContent: boolean;
  handleRetry: () => void;
  saveToProject: () => void;
  handleViewProject: () => void;
  setGeneratedContent: (content: string) => void;
}
