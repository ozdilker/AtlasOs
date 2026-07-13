import { describe, expect, it } from 'vitest';
import { DiagnosticSeverity } from '../../src/diagnostics/diagnostic-severity.js';
import { TerminalReporter } from '../../src/intelligence/reporters/terminal-reporter.js';
import { createValidationEngineResult } from '../../src/intelligence/validation/validation-engine-result.js';

function createReporter(): TerminalReporter {
  return new TerminalReporter();
}

describe('TerminalReporter', () => {
  it('formats an empty report with PASS status', () => {
    const reporter = createReporter();
    const result = createValidationEngineResult([], 8, 5);

    const report = reporter.report(result);

    expect(report).toBe(
      [
        'Atlas Doctor Report',
        '',
        'Status:',
        'PASS',
        '',
        'Summary:',
        '',
        'Errors: 0',
        '',
        'Warnings: 0',
        '',
        'Rules Executed: 5',
        '',
        'Execution Time: 8 ms',
        '',
        'Diagnostics:',
        '',
        'No problems detected.',
      ].join('\n'),
    );
  });

  it('formats a single error diagnostic', () => {
    const reporter = createReporter();
    const result = createValidationEngineResult(
      [
        {
          code: 'README_MISSING',
          severity: DiagnosticSeverity.Error,
          message: 'Project is missing required file "README.md".',
          path: 'README.md',
        },
      ],
      12,
      5,
    );

    const report = reporter.report(result);

    expect(report).toContain('Status:\nFAIL');
    expect(report).toContain('Errors: 1');
    expect(report).toContain('Warnings: 0');
    expect(report).toContain(
      ['[ERROR] README_MISSING', 'README.md', 'Project is missing required file "README.md".'].join(
        '\n',
      ),
    );
  });

  it('formats multiple diagnostics', () => {
    const reporter = createReporter();
    const result = createValidationEngineResult(
      [
        {
          code: 'README_MISSING',
          severity: DiagnosticSeverity.Error,
          message: 'Project is missing required file "README.md".',
          path: 'README.md',
        },
        {
          code: 'CHANGELOG_MISSING',
          severity: DiagnosticSeverity.Warning,
          message: 'Project is missing recommended file "CHANGELOG.md".',
          path: 'CHANGELOG.md',
        },
      ],
      15,
      5,
    );

    const report = reporter.report(result);

    expect(report).toContain('Status:\nFAIL');
    expect(report).toContain('Errors: 1');
    expect(report).toContain('Warnings: 1');
    expect(report).toContain(
      ['[ERROR] README_MISSING', 'README.md', 'Project is missing required file "README.md".'].join(
        '\n',
      ),
    );
    expect(report).toContain(
      [
        '[WARNING] CHANGELOG_MISSING',
        'CHANGELOG.md',
        'Project is missing recommended file "CHANGELOG.md".',
      ].join('\n'),
    );
  });

  it('outputs PASS when only warnings are present', () => {
    const reporter = createReporter();
    const result = createValidationEngineResult(
      [
        {
          code: 'CHANGELOG_MISSING',
          severity: DiagnosticSeverity.Warning,
          message: 'Project is missing recommended file "CHANGELOG.md".',
          path: 'CHANGELOG.md',
        },
      ],
      10,
      5,
    );

    const report = reporter.report(result);

    expect(report).toContain('Status:\nPASS');
    expect(report).toContain('Errors: 0');
    expect(report).toContain('Warnings: 1');
  });

  it('outputs FAIL when errors are present', () => {
    const reporter = createReporter();
    const result = createValidationEngineResult(
      [
        {
          code: 'PROJECT_DASHBOARD_MISSING',
          severity: DiagnosticSeverity.Error,
          message: 'Project is missing required file "PROJECT-DASHBOARD.md".',
          path: 'PROJECT-DASHBOARD.md',
        },
      ],
      6,
      5,
    );

    const report = reporter.report(result);

    expect(report).toContain('Status:\nFAIL');
    expect(report).toContain('Errors: 1');
  });

  it('formats the summary block with rules executed and execution time', () => {
    const reporter = createReporter();
    const result = createValidationEngineResult([], 42, 7);

    const report = reporter.report(result);

    expect(report).toContain('Summary:');
    expect(report).toContain('Rules Executed: 7');
    expect(report).toContain('Execution Time: 42 ms');
  });
});
