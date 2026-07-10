import { describe, expect, it } from 'vitest';
import { ProjectScaffoldService } from '../../src/services/project-scaffold-service.js';
import { README_TEMPLATE_ID } from '../../src/templates/catalog/readme-template.js';
import { TemplateCatalog } from '../../src/templates/catalog/template-catalog.js';
import { PROJECT_TEMPLATE_VARIABLE } from '../../src/templates/context/project-template-context.js';
import { DefaultTemplateEngine } from '../../src/templates/engine/default-template-engine.js';
import { StringTemplateRenderer } from '../../src/templates/engine/string-template-renderer.js';
import { InMemoryTemplateRegistry } from '../../src/templates/registry/in-memory-template-registry.js';

describe('ProjectScaffoldService', () => {
  function createService(): {
    service: ProjectScaffoldService;
    registry: InMemoryTemplateRegistry;
    engine: DefaultTemplateEngine;
  } {
    const registry = new InMemoryTemplateRegistry();
    const catalog = new TemplateCatalog();
    const renderer = new StringTemplateRenderer();
    const engine = new DefaultTemplateEngine(registry, renderer);

    return {
      service: new ProjectScaffoldService(catalog, registry, engine),
      registry,
      engine,
    };
  }

  it('registers catalog defaults during prepare', () => {
    const { service, registry } = createService();

    service.prepare('MyProject');

    expect(registry.has(README_TEMPLATE_ID)).toBe(true);
    expect(registry.list()).toHaveLength(1);
  });

  it('creates a project template context', () => {
    const { service } = createService();

    const prepared = service.prepare('MyProject');

    expect(prepared.context.getVariable(PROJECT_TEMPLATE_VARIABLE)).toBe('MyProject');
    expect(prepared.context.hasVariable(PROJECT_TEMPLATE_VARIABLE)).toBe(true);
  });

  it('exposes the injected template engine', () => {
    const { service, engine } = createService();

    const prepared = service.prepare('MyProject');

    expect(prepared.engine).toBe(engine);
  });
});
