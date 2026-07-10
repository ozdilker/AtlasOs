import { DiagnosticSeverity } from './diagnostic-severity.js';
import type { Diagnostic } from './diagnostic.js';

export type ValidationResult = {
  readonly diagnostics: readonly Diagnostic[];
  readonly hasErrors: boolean;
  readonly hasWarnings: boolean;
};

export function createValidationResult(diagnostics: Diagnostic[]): ValidationResult {
  return {
    diagnostics,
    hasErrors: diagnostics.some((diagnostic) => diagnostic.severity === DiagnosticSeverity.Error),
    hasWarnings: diagnostics.some(
      (diagnostic) => diagnostic.severity === DiagnosticSeverity.Warning,
    ),
  };
}

export const EMPTY_VALIDATION_RESULT: ValidationResult = createValidationResult([]);
