import type { StringTemplate } from '../types/string-template.js';

export const GOVERNANCE_INDEX_TEMPLATE_ID = 'governance-index';

export class GovernanceIndexTemplate implements StringTemplate {
  readonly metadata = {
    id: GOVERNANCE_INDEX_TEMPLATE_ID,
    name: 'Governance Index',
  };

  readonly content = `# Governance

Atlas Governance Documents.`;
}
