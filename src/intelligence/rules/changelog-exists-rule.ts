import { DiagnosticSeverity } from '../../diagnostics/diagnostic-severity.js';
import type { Diagnostic } from '../../diagnostics/diagnostic.js';
import type { InspectionSubject } from '../models/inspection-subject.js';
import { ValidationRule } from '../validation/validation-engine.js';

export const CHANGELOG_MISSING_RULE_CODE = 'CHANGELOG_MISSING';

const CHANGELOG_PATH = 'CHANGELOG.md';

export class ChangelogExistsRule extends ValidationRule {
  validate(subject: InspectionSubject): Diagnostic[] {
    const changelog = subject.files.find((file) => file.relativePath === CHANGELOG_PATH);

    if (changelog !== undefined) {
      return [];
    }

    return [
      {
        code: CHANGELOG_MISSING_RULE_CODE,
        severity: DiagnosticSeverity.Error,
        message: 'Project is missing required file "CHANGELOG.md".',
        path: CHANGELOG_PATH,
      },
    ];
  }
}
