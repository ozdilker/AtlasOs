import { describe, expect, it } from 'vitest';
import { DiagnosticSeverity } from '../../../src/diagnostics/diagnostic-severity.js';
import { InspectionOrigin } from '../../../src/intelligence/models/inspection-origin.js';
import type { InspectionSubject } from '../../../src/intelligence/models/inspection-subject.js';
import {
  GITIGNORE_MISSING_RULE_CODE,
  GitIgnoreExistsRule,
} from '../../../src/intelligence/rules/gitignore-exists-rule.js';

const GITIGNORE_PATH = '.gitignore';

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

describe('intelligence GitIgnoreExistsRule', () => {
  it('returns no diagnostics when .gitignore is present', () => {
    const rule = new GitIgnoreExistsRule();
    const subject = createSubject([
      {
        relativePath: GITIGNORE_PATH,
        content: '',
        encoding: 'utf-8',
        size: 0,
      },
    ]);

    expect(rule.validate(subject)).toEqual([]);
  });

  it('returns a single error diagnostic when .gitignore is missing', () => {
    const rule = new GitIgnoreExistsRule();
    const subject = createSubject([
      { relativePath: 'README.md', content: '# MyProject', encoding: 'utf-8', size: 11 },
    ]);

    expect(rule.validate(subject)).toEqual([
      {
        code: GITIGNORE_MISSING_RULE_CODE,
        severity: DiagnosticSeverity.Error,
        message: 'Project is missing required file ".gitignore".',
        path: GITIGNORE_PATH,
      },
    ]);
  });

  it('matches .gitignore case-sensitively', () => {
    const rule = new GitIgnoreExistsRule();
    const subject = createSubject([
      {
        relativePath: '.GITIGNORE',
        content: '',
        encoding: 'utf-8',
        size: 0,
      },
    ]);

    const diagnostics = rule.validate(subject);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe(GITIGNORE_MISSING_RULE_CODE);
    expect(diagnostics[0]?.path).toBe(GITIGNORE_PATH);
  });

  it('returns exactly one diagnostic when .gitignore is missing', () => {
    const rule = new GitIgnoreExistsRule();
    const subject = createSubject([]);

    const diagnostics = rule.validate(subject);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe(DiagnosticSeverity.Error);
  });
});
