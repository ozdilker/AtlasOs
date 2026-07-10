import { ProjectValidator } from './project-validator.js';
import { GovernanceReadmeExistsRule } from './rules/governance-readme-exists-rule.js';
import { ReadmeExistsRule } from './rules/readme-exists-rule.js';

export function createDefaultProjectValidator(): ProjectValidator {
  return new ProjectValidator([new ReadmeExistsRule(), new GovernanceReadmeExistsRule()]);
}
