import { describe, expect, it } from 'vitest';
import {
  PROJECT_TEMPLATE_VARIABLE,
  ProjectTemplateContext,
} from '../../src/templates/context/project-template-context.js';

describe('ProjectTemplateContext', () => {
  it('provides projectName', () => {
    const context = new ProjectTemplateContext('MyProject');

    expect(context.getVariable(PROJECT_TEMPLATE_VARIABLE)).toBe('MyProject');
    expect(context.getVariable('projectName')).toBe('MyProject');
  });

  it('returns undefined for unknown variables', () => {
    const context = new ProjectTemplateContext('MyProject');

    expect(context.getVariable('unknown')).toBeUndefined();
    expect(context.getVariable('')).toBeUndefined();
  });

  it('reports variable presence with hasVariable', () => {
    const context = new ProjectTemplateContext('MyProject');

    expect(context.hasVariable(PROJECT_TEMPLATE_VARIABLE)).toBe(true);
    expect(context.hasVariable('projectName')).toBe(true);
    expect(context.hasVariable('unknown')).toBe(false);
  });
});
