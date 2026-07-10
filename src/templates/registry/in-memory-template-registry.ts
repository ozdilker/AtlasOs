import type { TemplateRegistration } from '../registration/template-registration.js';
import { DuplicateTemplateError } from './template-registry-error.js';
import { TemplateRegistry } from './template-registry.js';

export class InMemoryTemplateRegistry extends TemplateRegistry {
  private readonly registrations = new Map<string, TemplateRegistration>();

  register(registration: TemplateRegistration): void {
    if (this.registrations.has(registration.id)) {
      throw new DuplicateTemplateError(registration.id);
    }

    this.registrations.set(registration.id, registration);
  }

  get(id: string): TemplateRegistration | undefined {
    return this.registrations.get(id);
  }

  has(id: string): boolean {
    return this.registrations.has(id);
  }

  list(): readonly TemplateRegistration[] {
    return [...this.registrations.values()];
  }
}
