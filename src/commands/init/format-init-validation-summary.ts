import { DiagnosticSeverity } from '../../diagnostics/diagnostic-severity.js';
import type { Diagnostic } from '../../diagnostics/diagnostic.js';
import type { ValidationResult } from '../../diagnostics/validation-result.js';

const VALIDATION_SEPARATOR = '------------------------------------';

function formatDiagnosticLine(diagnostic: Diagnostic): string {
  if (diagnostic.path !== undefined) {
    return `${diagnostic.path}: ${diagnostic.message}`;
  }

  return diagnostic.message;
}

function formatDiagnosticsSection(
  diagnostics: readonly Diagnostic[],
  severity: DiagnosticSeverity,
): string[] {
  const filtered = diagnostics.filter((diagnostic) => diagnostic.severity === severity);

  if (filtered.length === 0) {
    return [];
  }

  const label = severity === DiagnosticSeverity.Error ? 'Errors:' : 'Warnings:';

  return [label, '', ...filtered.map(formatDiagnosticLine)];
}

export function formatInitValidationSummary(validation: ValidationResult): string {
  const lines = [VALIDATION_SEPARATOR];

  if (!validation.hasErrors && !validation.hasWarnings) {
    lines.push('✔ Validation passed.');
    return lines.join('\n');
  }

  const warningLines = formatDiagnosticsSection(validation.diagnostics, DiagnosticSeverity.Warning);
  const errorLines = formatDiagnosticsSection(validation.diagnostics, DiagnosticSeverity.Error);

  if (warningLines.length > 0) {
    lines.push(...warningLines);
  }

  if (errorLines.length > 0) {
    if (warningLines.length > 0) {
      lines.push('');
    }

    lines.push(...errorLines);
  }

  return lines.join('\n');
}
