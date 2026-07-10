import { README_TEMPLATE_ID } from '../templates/catalog/readme-template.js';
import type { TemplateCatalog } from '../templates/catalog/template-catalog.js';
import { ProjectTemplateContext } from '../templates/context/project-template-context.js';
import type { TemplateEngine } from '../templates/engine/template-engine.js';
import type { TemplateRegistry } from '../templates/registry/template-registry.js';

export type PreparedProjectScaffold = {
  readonly context: ProjectTemplateContext;
  readonly engine: TemplateEngine;
};

export class ProjectScaffoldService {
  constructor(
    private readonly catalog: TemplateCatalog,
    private readonly registry: TemplateRegistry,
    private readonly engine: TemplateEngine,
  ) {}

  prepare(projectName: string): PreparedProjectScaffold {
    this.catalog.registerDefaults(this.registry);

    return {
      context: new ProjectTemplateContext(projectName),
      engine: this.engine,
    };
  }

  renderReadme(projectName: string): string {
    const prepared = this.prepare(projectName);

    return prepared.engine.render(README_TEMPLATE_ID, prepared.context);
  }
}
