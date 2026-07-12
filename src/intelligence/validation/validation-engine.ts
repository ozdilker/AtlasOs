import type { Diagnostic } from '../../diagnostics/diagnostic.js';
import type { InspectionSubject } from '../models/inspection-subject.js';
import {
  type ValidationEngineResult,
  createValidationEngineResult,
} from './validation-engine-result.js';

export abstract class ValidationRule {
  abstract validate(subject: InspectionSubject): Diagnostic[];
}

export class ValidationEngine {
  constructor(
    private readonly rules: readonly ValidationRule[],
    private readonly getTimeMs: () => number = () => performance.now(),
  ) {}

  validate(subject: InspectionSubject): ValidationEngineResult {
    const startedAt = this.getTimeMs();
    const diagnostics: Diagnostic[] = [];

    for (const rule of this.rules) {
      diagnostics.push(...rule.validate(subject));
    }

    const executionTimeMs = this.getTimeMs() - startedAt;

    return createValidationEngineResult(diagnostics, executionTimeMs, this.rules.length);
  }
}
