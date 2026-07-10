import { describe, expect, it } from 'vitest';
import { DiagnosticSeverity } from '../../../src/diagnostics/diagnostic-severity.js';
import {
  README_EXISTS_RULE_CODE,
  ReadmeExistsRule,
} from '../../../src/diagnostics/rules/readme-exists-rule.js';
import { createGenerationResult } from '../helpers/create-generation-result.js';

describe('ReadmeExistsRule', () => {
  it('returns no diagnostics when README.md is present', () => {
    const rule = new ReadmeExistsRule();
    const result = createGenerationResult([
      { relativePath: 'README.md', content: '# MyProject', encoding: 'utf-8' },
    ]);

    expect(rule.validate(result)).toEqual([]);
  });

  it('returns an error diagnostic when README.md is missing', () => {
    const rule = new ReadmeExistsRule();
    const result = createGenerationResult([
      { relativePath: 'CHANGELOG.md', content: '# Changelog', encoding: 'utf-8' },
    ]);

    expect(rule.validate(result)).toEqual([
      {
        code: README_EXISTS_RULE_CODE,
        severity: DiagnosticSeverity.Error,
        message: 'Generated project is missing required file "README.md".',
        path: 'README.md',
      },
    ]);
  });
});
