import { DiagnosticSeverity } from '../../diagnostics/diagnostic-severity.js';
import type { Diagnostic } from '../../diagnostics/diagnostic.js';

export type ValidationEngineResult = {
  readonly diagnostics: readonly Diagnostic[];
  readonly hasErrors: boolean;
  readonly hasWarnings: boolean;
  readonly executionTimeMs: number;
  readonly rulesExecuted: number;
};

export function createValidationEngineResult(
  diagnostics: readonly Diagnostic[],
  executionTimeMs: number,
  rulesExecuted: number,
): ValidationEngineResult {
  return {
    diagnostics,
    hasErrors: diagnostics.some((diagnostic) => diagnostic.severity === DiagnosticSeverity.Error),
    hasWarnings: diagnostics.some(
      (diagnostic) => diagnostic.severity === DiagnosticSeverity.Warning,
    ),
    executionTimeMs,
    rulesExecuted,
  };
}
