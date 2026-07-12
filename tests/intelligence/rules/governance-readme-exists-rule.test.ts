import { describe, expect, it } from 'vitest';
import { DiagnosticSeverity } from '../../../src/diagnostics/diagnostic-severity.js';
import { InspectionOrigin } from '../../../src/intelligence/models/inspection-origin.js';
import type { InspectionSubject } from '../../../src/intelligence/models/inspection-subject.js';
import {
  GOVERNANCE_README_MISSING_RULE_CODE,
  GovernanceReadmeExistsRule,
} from '../../../src/intelligence/rules/governance-readme-exists-rule.js';

const GOVERNANCE_README_PATH = 'docs/00-governance/README.md';

function createSubject(files: InspectionSubject['files']): InspectionSubject {
  return {
    id: 'generation:MyProject',
    origin: InspectionOrigin.Generation,
    projectName: 'MyProject',
    generatedAt: '2026-07-12T15:00:00.000Z',
    files,
    metadata: {},
  };
}

describe('intelligence GovernanceReadmeExistsRule', () => {
  it('returns no diagnostics when the governance README is present', () => {
    const rule = new GovernanceReadmeExistsRule();
    const subject = createSubject([
      {
        relativePath: GOVERNANCE_README_PATH,
        content: '# Governance',
        encoding: 'utf-8',
        size: 12,
      },
    ]);

    expect(rule.validate(subject)).toEqual([]);
  });

  it('returns a single error diagnostic when the governance README is missing', () => {
    const rule = new GovernanceReadmeExistsRule();
    const subject = createSubject([
      { relativePath: 'README.md', content: '# MyProject', encoding: 'utf-8', size: 11 },
    ]);

    expect(rule.validate(subject)).toEqual([
      {
        code: GOVERNANCE_README_MISSING_RULE_CODE,
        severity: DiagnosticSeverity.Error,
        message: `Project is missing required file "${GOVERNANCE_README_PATH}".`,
        path: GOVERNANCE_README_PATH,
      },
    ]);
  });

  it('matches the governance README path case-sensitively', () => {
    const rule = new GovernanceReadmeExistsRule();
    const subject = createSubject([
      {
        relativePath: 'docs/00-governance/readme.md',
        content: '# Governance',
        encoding: 'utf-8',
        size: 12,
      },
    ]);

    const diagnostics = rule.validate(subject);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe(GOVERNANCE_README_MISSING_RULE_CODE);
    expect(diagnostics[0]?.path).toBe(GOVERNANCE_README_PATH);
  });

  it('returns exactly one diagnostic when the governance README is missing', () => {
    const rule = new GovernanceReadmeExistsRule();
    const subject = createSubject([]);

    const diagnostics = rule.validate(subject);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe(DiagnosticSeverity.Error);
  });
});
