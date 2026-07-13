import { describe, expect, it } from 'vitest';
import { formatInitValidationSummary } from '../../src/commands/init/format-init-validation-summary.js';
import { DiagnosticSeverity } from '../../src/diagnostics/diagnostic-severity.js';
import { createValidationResult } from '../../src/diagnostics/validation-result.js';

describe('formatInitValidationSummary', () => {
  it('formats a passing validation result', () => {
    const summary = formatInitValidationSummary(createValidationResult([]));

    expect(summary).toBe('------------------------------------\n✔ Validation passed.');
  });

  it('formats warnings', () => {
    const summary = formatInitValidationSummary(
      createValidationResult([
        {
          code: 'TEMPLATE_WARNING',
          severity: DiagnosticSeverity.Warning,
          message: 'Template uses deprecated placeholder.',
          path: 'README.md',
        },
      ]),
    );

    expect(summary).toBe(
      [
        '------------------------------------',
        'Warnings:',
        '',
        'README.md: Template uses deprecated placeholder.',
      ].join('\n'),
    );
  });

  it('formats errors', () => {
    const summary = formatInitValidationSummary(
      createValidationResult([
        {
          code: 'README_MISSING',
          severity: DiagnosticSeverity.Error,
          message: 'README.md is required but missing.',
          path: 'README.md',
        },
      ]),
    );

    expect(summary).toBe(
      [
        '------------------------------------',
        'Errors:',
        '',
        'README.md: README.md is required but missing.',
      ].join('\n'),
    );
  });

  it('formats warnings and errors together', () => {
    const summary = formatInitValidationSummary(
      createValidationResult([
        {
          code: 'TEMPLATE_WARNING',
          severity: DiagnosticSeverity.Warning,
          message: 'Template uses deprecated placeholder.',
        },
        {
          code: 'README_MISSING',
          severity: DiagnosticSeverity.Error,
          message: 'README.md is required but missing.',
          path: 'README.md',
        },
      ]),
    );

    expect(summary).toBe(
      [
        '------------------------------------',
        'Warnings:',
        '',
        'Template uses deprecated placeholder.',
        '',
        'Errors:',
        '',
        'README.md: README.md is required but missing.',
      ].join('\n'),
    );
  });
});
