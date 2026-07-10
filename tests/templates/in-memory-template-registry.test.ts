import { describe, expect, it } from 'vitest';
import type { TemplateRegistration } from '../../src/templates/registration/template-registration.js';
import { InMemoryTemplateRegistry } from '../../src/templates/registry/in-memory-template-registry.js';
import { DuplicateTemplateError } from '../../src/templates/registry/template-registry-error.js';
import type { Template } from '../../src/templates/types/template.js';

function createTemplate(id: string, name: string): Template {
  return {
    metadata: {
      id,
      name,
    },
  };
}

function createRegistration(
  id: string,
  name: string,
  metadataOverrides: Partial<TemplateRegistration['metadata']> = {},
): TemplateRegistration {
  return {
    id,
    template: createTemplate(id, name),
    metadata: {
      version: '1.0.0',
      category: 'documentation',
      tags: ['init'],
      ...metadataOverrides,
    },
  };
}

describe('InMemoryTemplateRegistry', () => {
  it('registers and retrieves a registration by id', () => {
    const registry = new InMemoryTemplateRegistry();
    const registration = createRegistration('readme', 'README Template');

    registry.register(registration);

    expect(registry.get('readme')).toBe(registration);
    expect(registry.has('readme')).toBe(true);
  });

  it('returns undefined for an unknown template id', () => {
    const registry = new InMemoryTemplateRegistry();

    expect(registry.get('missing')).toBeUndefined();
    expect(registry.has('missing')).toBe(false);
  });

  it('lists all registered registrations', () => {
    const registry = new InMemoryTemplateRegistry();
    const readme = createRegistration('readme', 'README Template');
    const changelog = createRegistration('changelog', 'CHANGELOG Template');

    registry.register(readme);
    registry.register(changelog);

    expect(registry.list()).toEqual([readme, changelog]);
  });

  it('preserves registration metadata', () => {
    const registry = new InMemoryTemplateRegistry();
    const registration = createRegistration('readme', 'README Template', {
      version: '2.0.0',
      category: 'project',
      tags: ['readme', 'docs'],
      description: 'Project README template',
    });

    registry.register(registration);

    expect(registry.get('readme')).toEqual(registration);
    expect(registry.get('readme')?.metadata).toEqual({
      version: '2.0.0',
      category: 'project',
      tags: ['readme', 'docs'],
      description: 'Project README template',
    });
  });

  it('rejects duplicate template ids with a descriptive error', () => {
    const registry = new InMemoryTemplateRegistry();

    registry.register(createRegistration('readme', 'README Template'));

    expect(() => registry.register(createRegistration('readme', 'Duplicate README'))).toThrow(
      DuplicateTemplateError,
    );
    expect(() => registry.register(createRegistration('readme', 'Duplicate README'))).toThrow(
      'Template with id "readme" is already registered.',
    );
    expect(registry.list()).toHaveLength(1);
  });
});
