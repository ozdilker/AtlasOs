import { DiagnosticSeverity } from '../../diagnostics/diagnostic-severity.js';
import type { Diagnostic } from '../../diagnostics/diagnostic.js';
import type { ValidationEngineResult } from '../validation/validation-engine-result.js';
import { Reporter } from './reporter.js';

function countDiagnosticsBySeverity(
  diagnostics: readonly Diagnostic[],
  severity: DiagnosticSeverity,
): number {
  return diagnostics.filter((diagnostic) => diagnostic.severity === severity).length;
}

function formatSeverityLabel(severity: DiagnosticSeverity): string {
  switch (severity) {
    case DiagnosticSeverity.Error:
      return 'ERROR';
    case DiagnosticSeverity.Warning:
      return 'WARNING';
    case DiagnosticSeverity.Info:
      return 'INFO';
  }
}

function formatDiagnostic(diagnostic: Diagnostic): string {
  const lines = [`[${formatSeverityLabel(diagnostic.severity)}] ${diagnostic.code}`];

  if (diagnostic.path !== undefined) {
    lines.push(diagnostic.path);
  }

  lines.push(diagnostic.message);

  return lines.join('\n');
}

function formatDiagnosticsSection(diagnostics: readonly Diagnostic[]): string {
  if (diagnostics.length === 0) {
    return 'No problems detected.';
  }

  return diagnostics.map(formatDiagnostic).join('\n\n');
}

export class TerminalReporter extends Reporter {
  report(result: ValidationEngineResult): string {
    const errorCount = countDiagnosticsBySeverity(result.diagnostics, DiagnosticSeverity.Error);
    const warningCount = countDiagnosticsBySeverity(result.diagnostics, DiagnosticSeverity.Warning);
    const status = result.hasErrors ? 'FAIL' : 'PASS';

    return [
      'Atlas Doctor Report',
      '',
      'Status:',
      status,
      '',
      'Summary:',
      '',
      `Errors: ${errorCount}`,
      '',
      `Warnings: ${warningCount}`,
      '',
      `Rules Executed: ${result.rulesExecuted}`,
      '',
      `Execution Time: ${result.executionTimeMs} ms`,
      '',
      'Diagnostics:',
      '',
      formatDiagnosticsSection(result.diagnostics),
    ].join('\n');
  }
}
