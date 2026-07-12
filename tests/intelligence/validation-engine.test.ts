import { describe, expect, it } from 'vitest';
import { DiagnosticSeverity } from '../../src/diagnostics/diagnostic-severity.js';
import type { Diagnostic } from '../../src/diagnostics/diagnostic.js';
import { InspectionOrigin } from '../../src/intelligence/models/inspection-origin.js';
import type { InspectionSubject } from '../../src/intelligence/models/inspection-subject.js';
import {
  ValidationEngine,
  ValidationRule,
} from '../../src/intelligence/validation/validation-engine.js';

const SAMPLE_SUBJECT: InspectionSubject = {
  id: 'generation:MyProject',
  origin: InspectionOrigin.Generation,
  projectName: 'MyProject',
  generatedAt: '2026-07-12T15:00:00.000Z',
  files: [
    {
      relativePath: 'README.md',
      content: '# MyProject',
      encoding: 'utf-8',
      size: 11,
    },
  ],
  metadata: {
    generationVersion: '0.2.0-alpha',
    validationState: 'passed',
  },
};

class FirstRule extends ValidationRule {
  validate(_subject: InspectionSubject): Diagnostic[] {
    return [
      {
        code: 'FIRST_RULE',
        severity: DiagnosticSeverity.Info,
        message: 'First rule executed.',
      },
    ];
  }
}

class SecondRule extends ValidationRule {
  validate(_subject: InspectionSubject): Diagnostic[] {
    return [
      {
        code: 'SECOND_RULE',
        severity: DiagnosticSeverity.Warning,
        message: 'Second rule executed.',
      },
    ];
  }
}

class ThirdRule extends ValidationRule {
  validate(_subject: InspectionSubject): Diagnostic[] {
    return [
      {
        code: 'THIRD_RULE',
        severity: DiagnosticSeverity.Error,
        message: 'Third rule executed.',
        path: 'README.md',
      },
    ];
  }
}

class SilentRule extends ValidationRule {
  validate(_subject: InspectionSubject): Diagnostic[] {
    return [];
  }
}

describe('ValidationEngine', () => {
  it('executes a single rule', () => {
    const engine = new ValidationEngine([new FirstRule()]);

    const result = engine.validate(SAMPLE_SUBJECT);

    expect(result.diagnostics).toEqual([
      {
        code: 'FIRST_RULE',
        severity: DiagnosticSeverity.Info,
        message: 'First rule executed.',
      },
    ]);
    expect(result.hasErrors).toBe(false);
    expect(result.hasWarnings).toBe(false);
    expect(result.rulesExecuted).toBe(1);
  });

  it('aggregates diagnostics from multiple rules', () => {
    const engine = new ValidationEngine([new FirstRule(), new SecondRule(), new ThirdRule()]);

    const result = engine.validate(SAMPLE_SUBJECT);

    expect(result.diagnostics).toHaveLength(3);
    expect(result.hasErrors).toBe(true);
    expect(result.hasWarnings).toBe(true);
    expect(result.rulesExecuted).toBe(3);
  });

  it('preserves rule order in aggregated diagnostics', () => {
    const engine = new ValidationEngine([new FirstRule(), new SecondRule(), new ThirdRule()]);

    const result = engine.validate(SAMPLE_SUBJECT);

    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      'FIRST_RULE',
      'SECOND_RULE',
      'THIRD_RULE',
    ]);
  });

  it('runs every rule without stopping on the first error', () => {
    const engine = new ValidationEngine([new ThirdRule(), new SilentRule(), new FirstRule()]);

    const result = engine.validate(SAMPLE_SUBJECT);

    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      'THIRD_RULE',
      'FIRST_RULE',
    ]);
    expect(result.rulesExecuted).toBe(3);
  });

  it('populates execution time from the injected clock', () => {
    const timestamps = [100, 142];
    let index = 0;
    const engine = new ValidationEngine([new FirstRule()], () => {
      const value = timestamps[index] ?? timestamps[timestamps.length - 1] ?? 0;
      index += 1;
      return value;
    });

    const result = engine.validate(SAMPLE_SUBJECT);

    expect(result.executionTimeMs).toBe(42);
  });
});
