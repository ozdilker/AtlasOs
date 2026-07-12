import { describe, expect, it } from 'vitest';
import { DiagnosticSeverity } from '../../../src/diagnostics/diagnostic-severity.js';
import { InspectionOrigin } from '../../../src/intelligence/models/inspection-origin.js';
import type { InspectionSubject } from '../../../src/intelligence/models/inspection-subject.js';
import {
  README_MISSING_RULE_CODE,
  ReadmeExistsRule,
} from '../../../src/intelligence/rules/readme-exists-rule.js';

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

describe('intelligence ReadmeExistsRule', () => {
  it('returns no diagnostics when README.md is present', () => {
    const rule = new ReadmeExistsRule();
    const subject = createSubject([
      { relativePath: 'README.md', content: '# MyProject', encoding: 'utf-8', size: 11 },
    ]);

    expect(rule.validate(subject)).toEqual([]);
  });

  it('returns a single error diagnostic when README.md is missing', () => {
    const rule = new ReadmeExistsRule();
    const subject = createSubject([
      { relativePath: 'CHANGELOG.md', content: '# Changelog', encoding: 'utf-8', size: 11 },
    ]);

    expect(rule.validate(subject)).toEqual([
      {
        code: README_MISSING_RULE_CODE,
        severity: DiagnosticSeverity.Error,
        message: 'Project is missing required file "README.md".',
        path: 'README.md',
      },
    ]);
  });

  it('matches README.md case-sensitively', () => {
    const rule = new ReadmeExistsRule();
    const subject = createSubject([
      { relativePath: 'readme.md', content: '# MyProject', encoding: 'utf-8', size: 11 },
    ]);

    const diagnostics = rule.validate(subject);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe(README_MISSING_RULE_CODE);
    expect(diagnostics[0]?.path).toBe('README.md');
  });

  it('returns exactly one diagnostic when README.md is missing', () => {
    const rule = new ReadmeExistsRule();
    const subject = createSubject([]);

    const diagnostics = rule.validate(subject);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe(DiagnosticSeverity.Error);
  });
});
