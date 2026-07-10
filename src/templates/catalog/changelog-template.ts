import type { StringTemplate } from '../types/string-template.js';

export const CHANGELOG_TEMPLATE_ID = 'changelog';

export class ChangelogTemplate implements StringTemplate {
  readonly metadata = {
    id: CHANGELOG_TEMPLATE_ID,
    name: 'CHANGELOG',
  };

  readonly content = `# Changelog

Initial release.`;
}
