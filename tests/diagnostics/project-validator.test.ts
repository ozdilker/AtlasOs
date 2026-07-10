import { describe, expect, it } from 'vitest';
import { DiagnosticSeverity } from '../../src/diagnostics/diagnostic-severity.js';
import type { Diagnostic } from '../../src/diagnostics/diagnostic.js';
import { ProjectValidator } from '../../src/diagnostics/project-validator.js';
import { GovernanceReadmeExistsRule } from '../../src/diagnostics/rules/governance-readme-exists-rule.js';
import { ReadmeExistsRule } from '../../src/diagnostics/rules/readme-exists-rule.js';
import { ValidationRule } from '../../src/diagnostics/validation-rule.js';
import type { GenerationResult } from '../../src/services/project-generation/generation-result.js';
import { createGenerationResult } from './helpers/create-generation-result.js';

class SampleWarningRule extends ValidationRule {
  validate(_result: GenerationResult): Diagnostic[] {
    return [
      {
        code: 'SAMPLE_WARNING',
        severity: DiagnosticSeverity.Warning,
        message: 'Sample warning.',
      },
    ];
  }
}

describe('ProjectValidator', () => {
  it('passes when all rules are satisfied', () => {
    const validator = new ProjectValidator([
      new ReadmeExistsRule(),
      new GovernanceReadmeExistsRule(),
    ]);
    const result = createGenerationResult([
      { relativePath: 'README.md', content: '# MyProject', encoding: 'utf-8' },
      {
        relativePath: 'docs/00-governance/README.md',
        content: '# Governance',
        encoding: 'utf-8',
      },
    ]);

    const validation = validator.validate(result);

    expect(validation.diagnostics).toEqual([]);
    expect(validation.hasErrors).toBe(false);
    expect(validation.hasWarnings).toBe(false);
  });

  it('aggregates diagnostics from multiple rules', () => {
    const validator = new ProjectValidator([
      new ReadmeExistsRule(),
      new GovernanceReadmeExistsRule(),
    ]);
    const result = createGenerationResult([]);

    const validation = validator.validate(result);

    expect(validation.diagnostics).toHaveLength(2);
    expect(
      validation.diagnostics.every(
        (diagnostic) => diagnostic.severity === DiagnosticSeverity.Error,
      ),
    ).toBe(true);
    expect(validation.hasErrors).toBe(true);
    expect(validation.hasWarnings).toBe(false);
  });

  it('reports warnings without setting hasErrors', () => {
    const validator = new ProjectValidator([new SampleWarningRule()]);
    const result = createGenerationResult([]);

    const validation = validator.validate(result);

    expect(validation.hasWarnings).toBe(true);
    expect(validation.hasErrors).toBe(false);
  });
});
