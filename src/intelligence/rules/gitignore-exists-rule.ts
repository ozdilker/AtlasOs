import { DiagnosticSeverity } from '../../diagnostics/diagnostic-severity.js';
import type { Diagnostic } from '../../diagnostics/diagnostic.js';
import type { InspectionSubject } from '../models/inspection-subject.js';
import { ValidationRule } from '../validation/validation-engine.js';

export const GITIGNORE_MISSING_RULE_CODE = 'GITIGNORE_MISSING';

const GITIGNORE_PATH = '.gitignore';

export class GitIgnoreExistsRule extends ValidationRule {
  validate(subject: InspectionSubject): Diagnostic[] {
    const gitignore = subject.files.find((file) => file.relativePath === GITIGNORE_PATH);

    if (gitignore !== undefined) {
      return [];
    }

    return [
      {
        code: GITIGNORE_MISSING_RULE_CODE,
        severity: DiagnosticSeverity.Error,
        message: 'Project is missing required file ".gitignore".',
        path: GITIGNORE_PATH,
      },
    ];
  }
}
