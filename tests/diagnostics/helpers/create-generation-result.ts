import { EMPTY_VALIDATION_RESULT } from '../../../src/diagnostics/validation-result.js';
import type { GeneratedFile } from '../../../src/services/project-generation/generated-file.js';
import type { GenerationResult } from '../../../src/services/project-generation/generation-result.js';

export function createGenerationResult(
  generatedFiles: readonly GeneratedFile[],
  overrides: Partial<GenerationResult> = {},
): GenerationResult {
  return {
    projectName: 'MyProject',
    plan: {
      projectName: 'MyProject',
      directories: [],
      plannedFiles: [],
    },
    generatedFiles,
    directories: [],
    warnings: [],
    errors: [],
    validation: EMPTY_VALIDATION_RESULT,
    ...overrides,
  };
}
