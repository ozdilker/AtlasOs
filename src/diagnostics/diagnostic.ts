import type { DiagnosticSeverity } from './diagnostic-severity.js';

export type Diagnostic = {
  readonly message: string;
  readonly severity: DiagnosticSeverity;
  readonly code: string;
  readonly path?: string;
};
