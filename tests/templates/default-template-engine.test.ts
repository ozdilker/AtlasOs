import { describe, expect, it, vi } from 'vitest';
import type { TemplateContext } from '../../src/templates/context/template-context.js';
import { DefaultTemplateEngine } from '../../src/templates/engine/default-template-engine.js';
import { TemplateNotFoundError } from '../../src/templates/engine/template-engine-error.js';
import { TemplateRenderer } from '../../src/templates/engine/template-renderer.js';
import { TemplateRegistry } from '../../src/templates/registry/template-registry.js';
import type { Template } from '../../src/templates/types/template.js';

const template: Template = {
  metadata: {
    id: 'readme',
    name: 'README Template',
  },
};

const context: TemplateContext = {
  getVariable: () => undefined,
  hasVariable: () => false,
};

class MockTemplateRegistry extends TemplateRegistry {
  get = vi.fn<TemplateRegistry['get']>();
  register = vi.fn<TemplateRegistry['register']>();
  has = vi.fn<TemplateRegistry['has']>();
  list = vi.fn<TemplateRegistry['list']>();
}

class MockTemplateRenderer extends TemplateRenderer {
  render = vi.fn<TemplateRenderer['render']>();
}

describe('DefaultTemplateEngine', () => {
  it('renders a template successfully', () => {
    const registry = new MockTemplateRegistry();
    const renderer = new MockTemplateRenderer();

    registry.get.mockReturnValue(template);
    renderer.render.mockReturnValue('rendered output');

    const engine = new DefaultTemplateEngine(registry, renderer);
    const result = engine.render('readme', context);

    expect(result).toBe('rendered output');
  });

  it('throws TemplateNotFoundError when the template is missing', () => {
    const registry = new MockTemplateRegistry();
    const renderer = new MockTemplateRenderer();

    registry.get.mockReturnValue(undefined);

    const engine = new DefaultTemplateEngine(registry, renderer);

    expect(() => engine.render('missing', context)).toThrow(TemplateNotFoundError);
    expect(() => engine.render('missing', context)).toThrow(
      'Template with id "missing" was not found.',
    );
  });

  it('invokes the renderer exactly once', () => {
    const registry = new MockTemplateRegistry();
    const renderer = new MockTemplateRenderer();

    registry.get.mockReturnValue(template);
    renderer.render.mockReturnValue('rendered output');

    const engine = new DefaultTemplateEngine(registry, renderer);
    engine.render('readme', context);

    expect(renderer.render).toHaveBeenCalledOnce();
    expect(renderer.render).toHaveBeenCalledWith(template, context);
  });

  it('looks up the template from the registry exactly once', () => {
    const registry = new MockTemplateRegistry();
    const renderer = new MockTemplateRenderer();

    registry.get.mockReturnValue(template);
    renderer.render.mockReturnValue('rendered output');

    const engine = new DefaultTemplateEngine(registry, renderer);
    engine.render('readme', context);

    expect(registry.get).toHaveBeenCalledOnce();
    expect(registry.get).toHaveBeenCalledWith('readme');
  });
});
