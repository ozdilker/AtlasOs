import type { ValidationResult } from '../../diagnostics/validation-result.js';
import type { GeneratedFile } from './generated-file.js';
import type { GenerationPlan } from './generation-plan.js';

export type GenerationResult = {
  readonly projectName: string;
  readonly plan: GenerationPlan;
  readonly generatedFiles: readonly GeneratedFile[];
  readonly directories: readonly string[];
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly validation: ValidationResult;
};
