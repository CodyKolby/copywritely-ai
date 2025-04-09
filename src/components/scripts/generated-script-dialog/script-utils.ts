
// Re-export from utility files for backward compatibility
import { fetchTargetAudience } from './utils/api-fetcher';
import { generateScript } from './utils/script-generator';
import { saveScriptAsProject } from './utils/project-utils';
import type { ScriptGenerationResult } from './utils/types';

export { 
  fetchTargetAudience,
  generateScript,
  saveScriptAsProject
};

export type { ScriptGenerationResult };

