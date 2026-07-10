import type { TemplateRegistration } from '../registration/template-registration.js';
import type { TemplateRegistry } from '../registry/template-registry.js';
import { CHANGELOG_TEMPLATE_ID, ChangelogTemplate } from './changelog-template.js';
import {
  GOVERNANCE_INDEX_TEMPLATE_ID,
  GovernanceIndexTemplate,
} from './governance-index-template.js';
import {
  PROJECT_DASHBOARD_TEMPLATE_ID,
  ProjectDashboardTemplate,
} from './project-dashboard-template.js';
import { README_TEMPLATE_ID, ReadmeTemplate } from './readme-template.js';

const DEFAULT_TEMPLATE_REGISTRATIONS: readonly Omit<TemplateRegistration, 'template'>[] = [
  {
    id: README_TEMPLATE_ID,
    metadata: {
      version: '1.0.0',
      category: 'documentation',
      tags: ['readme', 'init'],
      description: 'Project README template',
    },
  },
  {
    id: CHANGELOG_TEMPLATE_ID,
    metadata: {
      version: '1.0.0',
      category: 'governance',
      tags: ['changelog', 'governance'],
      description: 'Project changelog template',
    },
  },
  {
    id: PROJECT_DASHBOARD_TEMPLATE_ID,
    metadata: {
      version: '1.0.0',
      category: 'governance',
      tags: ['dashboard', 'governance'],
      description: 'Project dashboard template',
    },
  },
  {
    id: GOVERNANCE_INDEX_TEMPLATE_ID,
    metadata: {
      version: '1.0.0',
      category: 'governance',
      tags: ['governance', 'index'],
      description: 'Governance index template',
    },
  },
];

const TEMPLATE_FACTORIES: Record<string, () => TemplateRegistration['template']> = {
  [README_TEMPLATE_ID]: () => new ReadmeTemplate(),
  [CHANGELOG_TEMPLATE_ID]: () => new ChangelogTemplate(),
  [PROJECT_DASHBOARD_TEMPLATE_ID]: () => new ProjectDashboardTemplate(),
  [GOVERNANCE_INDEX_TEMPLATE_ID]: () => new GovernanceIndexTemplate(),
};

export class TemplateCatalog {
  registerDefaults(registry: TemplateRegistry): void {
    for (const registration of DEFAULT_TEMPLATE_REGISTRATIONS) {
      const createTemplate = TEMPLATE_FACTORIES[registration.id];

      if (createTemplate === undefined) {
        continue;
      }

      registry.register({
        ...registration,
        template: createTemplate(),
      });
    }
  }
}
