import type { TemplateContext } from '../context/template-context.js';
import { TemplateNotFoundError } from './template-engine-error.js';
import { TemplateEngine } from './template-engine.js';

export class DefaultTemplateEngine extends TemplateEngine {
  override render(templateId: string, context: TemplateContext): string {
    const template = this.registry.get(templateId);

    if (template === undefined) {
      throw new TemplateNotFoundError(templateId);
    }

    return this.renderer.render(template, context);
  }
}
