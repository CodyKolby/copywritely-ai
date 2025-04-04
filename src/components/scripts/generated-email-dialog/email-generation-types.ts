
import { EmailStyle } from '../EmailStyleDialog';
import { NarrativeBlueprint } from './email-generation-service';

export interface UseEmailGenerationProps {
  open: boolean;
  targetAudienceId: string;
  templateId: string;
  advertisingGoal: string;
  emailStyle: EmailStyle;
  userId?: string;
}

export interface EmailGenerationState {
  isLoading: boolean;
  error: string | null;
  generatedSubject: string;
  alternativeSubject: string;
  generatedEmail: string;
  isSaving: boolean;
  projectSaved: boolean;
  projectId: string | null;
  narrativeBlueprint: NarrativeBlueprint | null;
  isShowingAlternative: boolean;
}

export interface EmailGenerationActions {
  toggleSubjectLine: () => void;
  handleRetry: () => void;
  saveToProject: () => void;
  handleViewProject: () => void;
  setGeneratedSubject: (subject: string) => void;
  setGeneratedEmail: (email: string) => void;
}

export type EmailGenerationHookReturn = EmailGenerationState & EmailGenerationActions;
