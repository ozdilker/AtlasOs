import { DiagnosticSeverity } from '../../diagnostics/diagnostic-severity.js';
import type { Diagnostic } from '../../diagnostics/diagnostic.js';
import type { InspectionSubject } from '../models/inspection-subject.js';
import { ValidationRule } from '../validation/validation-engine.js';

export const GOVERNANCE_README_MISSING_RULE_CODE = 'GOVERNANCE_README_MISSING';

const GOVERNANCE_README_PATH = 'docs/00-governance/README.md';

export class GovernanceReadmeExistsRule extends ValidationRule {
  validate(subject: InspectionSubject): Diagnostic[] {
    const governanceReadme = subject.files.find(
      (file) => file.relativePath === GOVERNANCE_README_PATH,
    );

    if (governanceReadme !== undefined) {
      return [];
    }

    return [
      {
        code: GOVERNANCE_README_MISSING_RULE_CODE,
        severity: DiagnosticSeverity.Error,
        message: `Project is missing required file "${GOVERNANCE_README_PATH}".`,
        path: GOVERNANCE_README_PATH,
      },
    ];
  }
}
