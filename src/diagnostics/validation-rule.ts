import type { GenerationResult } from '../services/project-generation/generation-result.js';
import type { Diagnostic } from './diagnostic.js';

export abstract class ValidationRule {
  abstract validate(result: GenerationResult): Diagnostic[];
}
