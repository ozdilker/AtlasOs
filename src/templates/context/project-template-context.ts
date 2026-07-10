import type { TemplateContext } from './template-context.js';

export const PROJECT_TEMPLATE_VARIABLE = 'projectName';

export class ProjectTemplateContext implements TemplateContext {
  constructor(private readonly projectName: string) {}

  getVariable(name: string): unknown {
    if (name === PROJECT_TEMPLATE_VARIABLE) {
      return this.projectName;
    }

    return undefined;
  }

  hasVariable(name: string): boolean {
    return name === PROJECT_TEMPLATE_VARIABLE;
  }
}
