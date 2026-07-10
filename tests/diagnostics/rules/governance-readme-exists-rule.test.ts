import { describe, expect, it } from 'vitest';
import { DiagnosticSeverity } from '../../../src/diagnostics/diagnostic-severity.js';
import {
  GOVERNANCE_README_EXISTS_RULE_CODE,
  GovernanceReadmeExistsRule,
} from '../../../src/diagnostics/rules/governance-readme-exists-rule.js';
import { createGenerationResult } from '../helpers/create-generation-result.js';

describe('GovernanceReadmeExistsRule', () => {
  it('returns no diagnostics when governance README is present', () => {
    const rule = new GovernanceReadmeExistsRule();
    const result = createGenerationResult([
      {
        relativePath: 'docs/00-governance/README.md',
        content: '# Governance',
        encoding: 'utf-8',
      },
    ]);

    expect(rule.validate(result)).toEqual([]);
  });

  it('returns an error diagnostic when governance README is missing', () => {
    const rule = new GovernanceReadmeExistsRule();
    const result = createGenerationResult([
      { relativePath: 'README.md', content: '# MyProject', encoding: 'utf-8' },
    ]);

    expect(rule.validate(result)).toEqual([
      {
        code: GOVERNANCE_README_EXISTS_RULE_CODE,
        severity: DiagnosticSeverity.Error,
        message: 'Generated project is missing required file "docs/00-governance/README.md".',
        path: 'docs/00-governance/README.md',
      },
    ]);
  });
});
