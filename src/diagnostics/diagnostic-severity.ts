export const DiagnosticSeverity = {
  Info: 'info',
  Warning: 'warning',
  Error: 'error',
} as const;

export type DiagnosticSeverity = (typeof DiagnosticSeverity)[keyof typeof DiagnosticSeverity];
