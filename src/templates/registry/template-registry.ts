import type { TemplateRegistration } from '../registration/template-registration.js';

export abstract class TemplateRegistry {
  abstract register(registration: TemplateRegistration): void;
  abstract get(id: string): TemplateRegistration | undefined;
  abstract has(id: string): boolean;
  abstract list(): readonly TemplateRegistration[];
}
