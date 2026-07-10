import { describe, expect, it } from 'vitest';
import type { TemplateContext } from '../../src/templates/context/template-context.js';
import { StringTemplateRenderer } from '../../src/templates/engine/string-template-renderer.js';
import type { StringTemplate } from '../../src/templates/types/string-template.js';

function createStringTemplate(content: string): StringTemplate {
  return {
    metadata: {
      id: 'test-template',
      name: 'Test Template',
    },
    content,
  };
}

function createContext(): TemplateContext {
  return {
    getVariable: () => 'ignored-value',
    hasVariable: () => true,
  };
}

describe('StringTemplateRenderer', () => {
  it('returns the original template content', () => {
    const renderer = new StringTemplateRenderer();
    const template = createStringTemplate('# Hello\n\nAtlas CLI');

    const result = renderer.render(template, createContext());

    expect(result).toBe('# Hello\n\nAtlas CLI');
  });

  it('supports empty content', () => {
    const renderer = new StringTemplateRenderer();
    const template = createStringTemplate('');

    const result = renderer.render(template, createContext());

    expect(result).toBe('');
  });

  it('accepts context but ignores it', () => {
    const renderer = new StringTemplateRenderer();
    const template = createStringTemplate('static content');
    const context: TemplateContext = {
      getVariable: (key) => `value-for-${key}`,
      hasVariable: () => true,
    };

    const result = renderer.render(template, context);

    expect(result).toBe('static content');
  });
});
