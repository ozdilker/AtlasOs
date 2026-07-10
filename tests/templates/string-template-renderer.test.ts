import { describe, expect, it, vi } from 'vitest';
import type { TemplateContext } from '../../src/templates/context/template-context.js';
import { StringTemplateRenderer } from '../../src/templates/engine/string-template-renderer.js';
import { TemplateInterpolator } from '../../src/templates/interpolation/template-interpolator.js';
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
    getVariable: () => 'MyProject',
    hasVariable: () => true,
  };
}

describe('StringTemplateRenderer', () => {
  it('delegates rendering to the interpolator', () => {
    const interpolator = new TemplateInterpolator();
    const interpolateSpy = vi.spyOn(interpolator, 'interpolate');
    const renderer = new StringTemplateRenderer(interpolator);
    const template = createStringTemplate('# {{projectName}}');
    const context = createContext();

    const result = renderer.render(template, context);

    expect(interpolateSpy).toHaveBeenCalledOnce();
    expect(interpolateSpy).toHaveBeenCalledWith('# {{projectName}}', context);
    expect(result).toBe('# MyProject');
  });

  it('supports empty content through the interpolator', () => {
    const renderer = new StringTemplateRenderer(new TemplateInterpolator());
    const template = createStringTemplate('');

    const result = renderer.render(template, createContext());

    expect(result).toBe('');
  });
});
