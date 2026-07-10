import type { Template } from '../types/template.js';
import type { RegistrationMetadata } from './registration-metadata.js';

export interface TemplateRegistration {
  readonly id: string;
  readonly template: Template;
  readonly metadata: RegistrationMetadata;
}
