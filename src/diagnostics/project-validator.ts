import type { GenerationResult } from '../services/project-generation/generation-result.js';
import type { Diagnostic } from './diagnostic.js';
import type { ValidationResult } from './validation-result.js';
import { createValidationResult } from './validation-result.js';
import type { ValidationRule } from './validation-rule.js';

export class ProjectValidator {
  constructor(private readonly rules: readonly ValidationRule[]) {}

  validate(result: GenerationResult): ValidationResult {
    const diagnostics = this.rules.flatMap((rule) => rule.validate(result));

    return createValidationResult(diagnostics);
  }
}
