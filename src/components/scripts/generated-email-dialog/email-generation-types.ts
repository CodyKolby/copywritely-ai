
import { EmailStyle } from '../EmailStyleDialog';
import { NarrativeBlueprint } from './services/narrative-blueprint-service';
import { EmailStructure } from './services/email-content-service';

export interface UseEmailGenerationProps {
  open: boolean;
  targetAudienceId: string;
  templateId: string;
  advertisingGoal: string;
  emailStyle: EmailStyle;
  userId?: string;
  existingProject?: {
    id: string;
    title: string;
    content: string;
    subject?: string;
    alternativeSubject?: string;
  };
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
  emailStructure: EmailStructure;
}

export interface EmailGenerationActions {
  toggleSubjectLine: () => void;
  handleRetry: () => void;
  saveToProject: () => Promise<void>;
  handleViewProject: () => void;
  setGeneratedSubject: (subject: string) => void;
  setGeneratedEmail: (email: string) => void;
  setAlternativeSubject: (subject: string) => void;
}

export type EmailGenerationHookReturn = EmailGenerationState & EmailGenerationActions & {
  debugInfo: any;  // Adding debugInfo to the return type
};
