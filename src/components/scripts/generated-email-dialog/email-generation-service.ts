
import { 
  generateNarrativeBlueprint,
  NarrativeBlueprint
} from './services/narrative-blueprint-service';

import { 
  generateSubjectLines,
  SubjectLinesResponse,
  DEFAULT_SUBJECT_LINE_PROMPT 
} from './services/subject-line-service';

import {
  saveEmailToProject
} from './services/email-project-service';

import { EmailStyle } from '../EmailStyleDialog';

// Re-export the key types and functions for backward compatibility
export { 
  NarrativeBlueprint,
  DEFAULT_SUBJECT_LINE_PROMPT,
  generateNarrativeBlueprint,
  generateSubjectLines,
  saveEmailToProject
};

// Additional exports if needed in the future
