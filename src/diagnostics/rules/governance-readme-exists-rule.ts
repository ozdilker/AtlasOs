import type { GenerationResult } from '../../services/project-generation/generation-result.js';
import { DiagnosticSeverity } from '../diagnostic-severity.js';
import type { Diagnostic } from '../diagnostic.js';
import { ValidationRule } from '../validation-rule.js';

export const GOVERNANCE_README_EXISTS_RULE_CODE = 'GOVERNANCE_README_MISSING';

const GOVERNANCE_README_PATH = 'docs/00-governance/README.md';

export class GovernanceReadmeExistsRule extends ValidationRule {
  validate(result: GenerationResult): Diagnostic[] {
    const governanceReadme = result.generatedFiles.find(
      (file) => file.relativePath === GOVERNANCE_README_PATH,
    );

    if (governanceReadme !== undefined) {
      return [];
    }

    return [
      {
        code: GOVERNANCE_README_EXISTS_RULE_CODE,
        severity: DiagnosticSeverity.Error,
        message: `Generated project is missing required file "${GOVERNANCE_README_PATH}".`,
        path: GOVERNANCE_README_PATH,
      },
    ];
  }
}
