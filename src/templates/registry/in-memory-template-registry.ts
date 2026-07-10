import type { Template } from '../types/template.js';
import { DuplicateTemplateError } from './template-registry-error.js';
import { TemplateRegistry } from './template-registry.js';

export class InMemoryTemplateRegistry extends TemplateRegistry {
  private readonly templates = new Map<string, Template>();

  register(template: Template): void {
    const templateId = template.metadata.id;

    if (this.templates.has(templateId)) {
      throw new DuplicateTemplateError(templateId);
    }

    this.templates.set(templateId, template);
  }

  get(id: string): Template | undefined {
    return this.templates.get(id);
  }

  has(id: string): boolean {
    return this.templates.has(id);
  }

  list(): readonly Template[] {
    return [...this.templates.values()];
  }
}
