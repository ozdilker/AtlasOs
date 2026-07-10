import type { Template } from './template.js';

export interface StringTemplate extends Template {
  readonly content: string;
}

export function isStringTemplate(template: Template): template is StringTemplate {
  return 'content' in template && typeof template.content === 'string';
}
