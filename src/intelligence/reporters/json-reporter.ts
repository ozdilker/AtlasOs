import { DiagnosticSeverity } from '../../diagnostics/diagnostic-severity.js';
import type { Diagnostic } from '../../diagnostics/diagnostic.js';
import type { ValidationEngineResult } from '../validation/validation-engine-result.js';
import { Reporter } from './reporter.js';

const SCHEMA_VERSION = '1.0';

type JsonReportDiagnostic = {
  code: string;
  severity: Diagnostic['severity'];
  message: string;
  path?: string;
};

type JsonReportDocument = {
  schemaVersion: string;
  status: 'pass' | 'fail';
  summary: {
    errors: number;
    warnings: number;
    rulesExecuted: number;
    executionTimeMs: number;
  };
  diagnostics: JsonReportDiagnostic[];
};

function countDiagnosticsBySeverity(
  diagnostics: readonly Diagnostic[],
  severity: DiagnosticSeverity,
): number {
  return diagnostics.filter((diagnostic) => diagnostic.severity === severity).length;
}

function mapDiagnostic(diagnostic: Diagnostic): JsonReportDiagnostic {
  const mapped: JsonReportDiagnostic = {
    code: diagnostic.code,
    severity: diagnostic.severity,
    message: diagnostic.message,
  };

  if (diagnostic.path !== undefined) {
    mapped.path = diagnostic.path;
  }

  return mapped;
}

function createJsonReportDocument(result: ValidationEngineResult): JsonReportDocument {
  return {
    schemaVersion: SCHEMA_VERSION,
    status: result.hasErrors ? 'fail' : 'pass',
    summary: {
      errors: countDiagnosticsBySeverity(result.diagnostics, DiagnosticSeverity.Error),
      warnings: countDiagnosticsBySeverity(result.diagnostics, DiagnosticSeverity.Warning),
      rulesExecuted: result.rulesExecuted,
      executionTimeMs: result.executionTimeMs,
    },
    diagnostics: result.diagnostics.map(mapDiagnostic),
  };
}

export class JsonReporter extends Reporter {
  report(result: ValidationEngineResult): string {
    return JSON.stringify(createJsonReportDocument(result), null, 2);
  }
}
