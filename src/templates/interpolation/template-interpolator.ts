import { PROJECT_TEMPLATE_VARIABLE } from '../context/project-template-context.js';
import type { TemplateContext } from '../context/template-context.js';
import { MissingTemplateVariableError } from './template-interpolator-error.js';

const PLACEHOLDER_PATTERN = /\{\{(\w+)\}\}/g;

const SUPPORTED_VARIABLES = new Set<string>([PROJECT_TEMPLATE_VARIABLE]);

export class TemplateInterpolator {
  interpolate(content: string, context: TemplateContext): string {
    return content.replace(PLACEHOLDER_PATTERN, (_match, variableName: string) => {
      if (!SUPPORTED_VARIABLES.has(variableName)) {
        throw new MissingTemplateVariableError(variableName);
      }

      if (!context.hasVariable(variableName)) {
        throw new MissingTemplateVariableError(variableName);
      }

      const value = context.getVariable(variableName);

      if (value === undefined) {
        throw new MissingTemplateVariableError(variableName);
      }

      return String(value);
    });
  }
}
