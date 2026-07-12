import { DiagnosticSeverity } from '../../diagnostics/diagnostic-severity.js';
import type { Diagnostic } from '../../diagnostics/diagnostic.js';
import type { InspectionSubject } from '../models/inspection-subject.js';
import { ValidationRule } from '../validation/validation-engine.js';

export const README_MISSING_RULE_CODE = 'README_MISSING';

const README_PATH = 'README.md';

export class ReadmeExistsRule extends ValidationRule {
  validate(subject: InspectionSubject): Diagnostic[] {
    const readme = subject.files.find((file) => file.relativePath === README_PATH);

    if (readme !== undefined) {
      return [];
    }

    return [
      {
        code: README_MISSING_RULE_CODE,
        severity: DiagnosticSeverity.Error,
        message: `Project is missing required file "${README_PATH}".`,
        path: README_PATH,
      },
    ];
  }
}
