import type { TemplateContext } from '../context/template-context.js';
import type { Template } from '../types/template.js';

export abstract class TemplateRenderer {
  abstract render(template: Template, context: TemplateContext): string;
}
