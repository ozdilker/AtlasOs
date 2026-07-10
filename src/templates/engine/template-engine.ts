import type { TemplateContext } from '../context/template-context.js';
import type { TemplateRegistry } from '../registry/template-registry.js';
import type { TemplateRenderer } from './template-renderer.js';

export abstract class TemplateEngine {
  constructor(
    protected readonly registry: TemplateRegistry,
    protected readonly renderer: TemplateRenderer,
  ) {}

  abstract render(templateId: string, context: TemplateContext): string;
}
