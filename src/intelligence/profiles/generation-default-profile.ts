import { GovernanceReadmeExistsRule } from '../rules/governance-readme-exists-rule.js';
import { ProjectDashboardExistsRule } from '../rules/project-dashboard-exists-rule.js';
import { ReadmeExistsRule } from '../rules/readme-exists-rule.js';
import type { ValidationProfile } from './validation-profile.js';

export const GENERATION_DEFAULT_PROFILE_ID = 'generation-default';

export const generationDefaultProfile: ValidationProfile = {
  id: GENERATION_DEFAULT_PROFILE_ID,
  name: 'Generation Default',
  description: 'Validates in-memory generation output before persistence.',
  rules: [
    new ReadmeExistsRule(),
    new GovernanceReadmeExistsRule(),
    new ProjectDashboardExistsRule(),
  ],
};
