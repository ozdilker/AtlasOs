import { CHANGELOG_TEMPLATE_ID } from '../../templates/catalog/changelog-template.js';
import { GOVERNANCE_INDEX_TEMPLATE_ID } from '../../templates/catalog/governance-index-template.js';
import { PROJECT_DASHBOARD_TEMPLATE_ID } from '../../templates/catalog/project-dashboard-template.js';
import { README_TEMPLATE_ID } from '../../templates/catalog/readme-template.js';

export const PROJECT_EMPTY_FILES = ['.gitignore'] as const;

export type TemplatedProjectFile = {
  readonly relativePath: string;
  readonly templateId: string;
};

export const TEMPLATED_PROJECT_FILES: readonly TemplatedProjectFile[] = [
  { relativePath: 'README.md', templateId: README_TEMPLATE_ID },
  { relativePath: 'CHANGELOG.md', templateId: CHANGELOG_TEMPLATE_ID },
  { relativePath: 'PROJECT-DASHBOARD.md', templateId: PROJECT_DASHBOARD_TEMPLATE_ID },
  {
    relativePath: 'docs/00-governance/README.md',
    templateId: GOVERNANCE_INDEX_TEMPLATE_ID,
  },
] as const;

export const PROJECT_GENERATED_FILE_PATHS = [
  ...TEMPLATED_PROJECT_FILES.map((file) => file.relativePath),
  ...PROJECT_EMPTY_FILES,
] as const;
