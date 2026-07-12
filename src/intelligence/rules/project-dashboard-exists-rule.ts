import { DiagnosticSeverity } from '../../diagnostics/diagnostic-severity.js';
import type { Diagnostic } from '../../diagnostics/diagnostic.js';
import type { InspectionSubject } from '../models/inspection-subject.js';
import { ValidationRule } from '../validation/validation-engine.js';

export const PROJECT_DASHBOARD_MISSING_RULE_CODE = 'PROJECT_DASHBOARD_MISSING';

const PROJECT_DASHBOARD_PATH = 'PROJECT-DASHBOARD.md';

export class ProjectDashboardExistsRule extends ValidationRule {
  validate(subject: InspectionSubject): Diagnostic[] {
    const projectDashboard = subject.files.find(
      (file) => file.relativePath === PROJECT_DASHBOARD_PATH,
    );

    if (projectDashboard !== undefined) {
      return [];
    }

    return [
      {
        code: PROJECT_DASHBOARD_MISSING_RULE_CODE,
        severity: DiagnosticSeverity.Error,
        message: 'Project is missing required file "PROJECT-DASHBOARD.md".',
        path: PROJECT_DASHBOARD_PATH,
      },
    ];
  }
}
