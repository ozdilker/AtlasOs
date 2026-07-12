import { describe, expect, it } from 'vitest';
import { DiagnosticSeverity } from '../../../src/diagnostics/diagnostic-severity.js';
import { InspectionOrigin } from '../../../src/intelligence/models/inspection-origin.js';
import type { InspectionSubject } from '../../../src/intelligence/models/inspection-subject.js';
import {
  PROJECT_DASHBOARD_MISSING_RULE_CODE,
  ProjectDashboardExistsRule,
} from '../../../src/intelligence/rules/project-dashboard-exists-rule.js';

const PROJECT_DASHBOARD_PATH = 'PROJECT-DASHBOARD.md';

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

describe('intelligence ProjectDashboardExistsRule', () => {
  it('returns no diagnostics when PROJECT-DASHBOARD.md is present', () => {
    const rule = new ProjectDashboardExistsRule();
    const subject = createSubject([
      {
        relativePath: PROJECT_DASHBOARD_PATH,
        content: '# Project Dashboard',
        encoding: 'utf-8',
        size: 19,
      },
    ]);

    expect(rule.validate(subject)).toEqual([]);
  });

  it('returns a single error diagnostic when PROJECT-DASHBOARD.md is missing', () => {
    const rule = new ProjectDashboardExistsRule();
    const subject = createSubject([
      { relativePath: 'README.md', content: '# MyProject', encoding: 'utf-8', size: 11 },
    ]);

    expect(rule.validate(subject)).toEqual([
      {
        code: PROJECT_DASHBOARD_MISSING_RULE_CODE,
        severity: DiagnosticSeverity.Error,
        message: 'Project is missing required file "PROJECT-DASHBOARD.md".',
        path: PROJECT_DASHBOARD_PATH,
      },
    ]);
  });

  it('matches PROJECT-DASHBOARD.md case-sensitively', () => {
    const rule = new ProjectDashboardExistsRule();
    const subject = createSubject([
      {
        relativePath: 'project-dashboard.md',
        content: '# Project Dashboard',
        encoding: 'utf-8',
        size: 19,
      },
    ]);

    const diagnostics = rule.validate(subject);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.code).toBe(PROJECT_DASHBOARD_MISSING_RULE_CODE);
    expect(diagnostics[0]?.path).toBe(PROJECT_DASHBOARD_PATH);
  });

  it('returns exactly one diagnostic when PROJECT-DASHBOARD.md is missing', () => {
    const rule = new ProjectDashboardExistsRule();
    const subject = createSubject([]);

    const diagnostics = rule.validate(subject);

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]?.severity).toBe(DiagnosticSeverity.Error);
  });
});
