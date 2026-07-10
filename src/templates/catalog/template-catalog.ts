import type { TemplateRegistration } from '../registration/template-registration.js';
import type { TemplateRegistry } from '../registry/template-registry.js';
import { README_TEMPLATE_ID, ReadmeTemplate } from './readme-template.js';

export class TemplateCatalog {
  registerDefaults(registry: TemplateRegistry): void {
    const readmeRegistration: TemplateRegistration = {
      id: README_TEMPLATE_ID,
      template: new ReadmeTemplate(),
      metadata: {
        version: '1.0.0',
        category: 'documentation',
        tags: ['readme', 'init'],
        description: 'Project README template',
      },
    };

    registry.register(readmeRegistration);
  }
}
