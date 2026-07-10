import { describe, expect, it } from 'vitest';
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

describe('InMemoryTemplateRegistry', () => {
  it('registers and retrieves a template by id', () => {
    const registry = new InMemoryTemplateRegistry();
    const template = createTemplate('readme', 'README Template');

    registry.register(template);

    expect(registry.get('readme')).toBe(template);
    expect(registry.has('readme')).toBe(true);
  });

  it('returns undefined for an unknown template id', () => {
    const registry = new InMemoryTemplateRegistry();

    expect(registry.get('missing')).toBeUndefined();
    expect(registry.has('missing')).toBe(false);
  });

  it('lists all registered templates', () => {
    const registry = new InMemoryTemplateRegistry();
    const readme = createTemplate('readme', 'README Template');
    const changelog = createTemplate('changelog', 'CHANGELOG Template');

    registry.register(readme);
    registry.register(changelog);

    expect(registry.list()).toEqual([readme, changelog]);
  });

  it('rejects duplicate template ids with a descriptive error', () => {
    const registry = new InMemoryTemplateRegistry();

    registry.register(createTemplate('readme', 'README Template'));

    expect(() => registry.register(createTemplate('readme', 'Duplicate README'))).toThrow(
      DuplicateTemplateError,
    );
    expect(() => registry.register(createTemplate('readme', 'Duplicate README'))).toThrow(
      'Template with id "readme" is already registered.',
    );
    expect(registry.list()).toHaveLength(1);
  });
});
