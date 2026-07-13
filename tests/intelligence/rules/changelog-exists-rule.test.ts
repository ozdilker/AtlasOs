import { describe, expect, it } from 'vitest';
import { DiagnosticSeverity } from '../../../src/diagnostics/diagnostic-severity.js';
import { InspectionOrigin } from '../../../src/intelligence/models/inspection-origin.js';
import type { InspectionSubject } from '../../../src/intelligence/models/inspection-subject.js';
import {
  CHANGELOG_MISSING_RULE_CODE,
  ChangelogExistsRule,
} from '../../../src/intelligence/rules/changelog-exists-rule.js';

const CHANGELOG_PATH = 'CHANGELOG.md';

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

describe('intelligence ChangelogExistsRule', () => {
  it('returns no diagnostics when CHANGELOG.md is present', () => {
    const rule = new ChangelogExistsRule();
    const subject = createSubject([
      {
        relativePath: CHANGELOG_PATH,
        content: '# Changelog\n\nInitial release.',
        encoding: 'utf-8',
        size: 28,
      },
    ]);

    expect(rule.validate(subject)).toEqual([]);
  });

  it('returns a single error diagnostic when CHANGELOG.md is missing', () => {
    const rule = new ChangelogExistsRule();
    const subject = createSubject([
      { relativePath: 'README.md', content: '# MyProject', encoding: 'utf-8', size: 11 },
    ]);

    expect(rule.validate(subject)).toEqual([
      {
        code: CHANGELOG_MISSING_RULE_CODE,
        severity: DiagnosticSeverity.Error,
        message: 'Project is missing required file "CHANGELOG.md".',
        path: CHANGELOG_PATH,
      },
    ]);
  });

  it('matches CHANGELOG.md case-sensitively', () => {
    const rule = new ChangelogExistsRule();
    const subject = createSubject([
      {
        relativePath: 'changelog.md',
        content: '# Changelog',
        encoding: 'utf-8',
        size: 11,
      },
    ]);

    const diagnostics = rule.validate(subject);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe(CHANGELOG_MISSING_RULE_CODE);
    expect(diagnostics[0]?.path).toBe(CHANGELOG_PATH);
  });

  it('returns exactly one diagnostic when CHANGELOG.md is missing', () => {
    const rule = new ChangelogExistsRule();
    const subject = createSubject([]);

    const diagnostics = rule.validate(subject);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe(DiagnosticSeverity.Error);
  });
});
