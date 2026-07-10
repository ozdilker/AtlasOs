import type { TemplateContext } from '../context/template-context.js';
import type { TemplateInterpolator } from '../interpolation/template-interpolator.js';
import { isStringTemplate } from '../types/string-template.js';
import type { Template } from '../types/template.js';
import { InvalidStringTemplateError } from './template-renderer-error.js';
import { TemplateRenderer } from './template-renderer.js';

export class StringTemplateRenderer extends TemplateRenderer {
  constructor(private readonly interpolator: TemplateInterpolator) {
    super();
  }

  render(template: Template, context: TemplateContext): string {
    if (!isStringTemplate(template)) {
      throw new InvalidStringTemplateError(template.metadata.id);
    }

    return this.interpolator.interpolate(template.content, context);
  }
}
