import type { GenerationResult } from '../../services/project-generation/generation-result.js';
import { DiagnosticSeverity } from '../diagnostic-severity.js';
import type { Diagnostic } from '../diagnostic.js';
import { ValidationRule } from '../validation-rule.js';

export const README_EXISTS_RULE_CODE = 'README_MISSING';

const README_PATH = 'README.md';

export class ReadmeExistsRule extends ValidationRule {
  validate(result: GenerationResult): Diagnostic[] {
    const readme = result.generatedFiles.find((file) => file.relativePath === README_PATH);

    if (readme !== undefined) {
      return [];
    }

    return [
      {
        code: README_EXISTS_RULE_CODE,
        severity: DiagnosticSeverity.Error,
        message: `Generated project is missing required file "${README_PATH}".`,
        path: README_PATH,
      },
    ];
  }
}
