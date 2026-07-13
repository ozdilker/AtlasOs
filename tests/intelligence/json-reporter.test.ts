import { describe, expect, it } from 'vitest';
import { DiagnosticSeverity } from '../../src/diagnostics/diagnostic-severity.js';
import { JsonReporter } from '../../src/intelligence/reporters/json-reporter.js';
import { createValidationEngineResult } from '../../src/intelligence/validation/validation-engine-result.js';

function createReporter(): JsonReporter {
  return new JsonReporter();
}

function parseReport(report: string): {
  schemaVersion: string;
  status: string;
  summary: {
    errors: number;
    warnings: number;
    rulesExecuted: number;
    executionTimeMs: number;
  };
  diagnostics: Array<{
    code: string;
    severity: string;
    message: string;
    path?: string;
  }>;
} {
  return JSON.parse(report) as ReturnType<typeof parseReport>;
}

describe('JsonReporter', () => {
  it('formats an empty report with pass status', () => {
    const reporter = createReporter();
    const result = createValidationEngineResult([], 8, 5);

    const report = parseReport(reporter.report(result));

    expect(report).toEqual({
      schemaVersion: '1.0',
      status: 'pass',
      summary: {
        errors: 0,
        warnings: 0,
        rulesExecuted: 5,
        executionTimeMs: 8,
      },
      diagnostics: [],
    });
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

    const report = parseReport(reporter.report(result));

    expect(report.status).toBe('fail');
    expect(report.diagnostics).toEqual([
      {
        code: 'README_MISSING',
        severity: DiagnosticSeverity.Error,
        path: 'README.md',
        message: 'Project is missing required file "README.md".',
      },
    ]);
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

    const report = parseReport(reporter.report(result));

    expect(report.status).toBe('fail');
    expect(report.diagnostics).toHaveLength(2);
    expect(report.summary.errors).toBe(1);
    expect(report.summary.warnings).toBe(1);
  });

  it('includes the summary block', () => {
    const reporter = createReporter();
    const result = createValidationEngineResult([], 42, 7);

    const report = parseReport(reporter.report(result));

    expect(report.summary).toEqual({
      errors: 0,
      warnings: 0,
      rulesExecuted: 7,
      executionTimeMs: 42,
    });
  });

  it('includes schema version 1.0', () => {
    const reporter = createReporter();
    const result = createValidationEngineResult([], 1, 1);

    const report = parseReport(reporter.report(result));

    expect(report.schemaVersion).toBe('1.0');
  });

  it('returns pretty-printed JSON', () => {
    const reporter = createReporter();
    const result = createValidationEngineResult([], 3, 2);

    const report = reporter.report(result);

    expect(report).toBe(
      JSON.stringify(
        {
          schemaVersion: '1.0',
          status: 'pass',
          summary: {
            errors: 0,
            warnings: 0,
            rulesExecuted: 2,
            executionTimeMs: 3,
          },
          diagnostics: [],
        },
        null,
        2,
      ),
    );
    expect(report).toContain('\n  "schemaVersion": "1.0",\n');
  });
});
