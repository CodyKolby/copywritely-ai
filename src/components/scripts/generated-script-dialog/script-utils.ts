
// Re-export from utility files for backward compatibility
import { fetchTargetAudience } from './utils/api-fetcher';
import { generateScript } from './utils/script-generator';
import { saveScriptAsProject } from './utils/project-utils';
import { ScriptGenerationResult } from './utils/types';

export { 
  fetchTargetAudience,
  generateScript,
  saveScriptAsProject,
  ScriptGenerationResult
};
