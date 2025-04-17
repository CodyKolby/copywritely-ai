
import { 
  generateNarrativeBlueprint,
  type NarrativeBlueprint
} from './services/narrative-blueprint-service';

import { 
  generateSubjectLines,
  type SubjectLinesResponse,
  DEFAULT_SUBJECT_LINE_PROMPT 
} from './services/subject-line-service';

import {
  saveEmailToProject
} from './services/email-project-service';

import { EmailStyle } from '../EmailStyleDialog';

// Re-export the key types and functions for backward compatibility
export { 
  generateNarrativeBlueprint,
  generateSubjectLines,
  saveEmailToProject,
  DEFAULT_SUBJECT_LINE_PROMPT
};

// Re-export types using export type
export type { 
  NarrativeBlueprint,
  SubjectLinesResponse
};

// Additional exports if needed in the future
