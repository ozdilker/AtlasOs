import { describe, expect, it } from 'vitest';
import {
  GENERATION_DEFAULT_PROFILE_ID,
  generationDefaultProfile,
} from '../../src/intelligence/profiles/generation-default-profile.js';
import { GovernanceReadmeExistsRule } from '../../src/intelligence/rules/governance-readme-exists-rule.js';
import { ProjectDashboardExistsRule } from '../../src/intelligence/rules/project-dashboard-exists-rule.js';
import { ReadmeExistsRule } from '../../src/intelligence/rules/readme-exists-rule.js';

describe('generationDefaultProfile', () => {
  it('defines the generation-default profile id', () => {
    expect(GENERATION_DEFAULT_PROFILE_ID).toBe('generation-default');
    expect(generationDefaultProfile.id).toBe('generation-default');
  });

  it('defines a human-readable profile name', () => {
    expect(generationDefaultProfile.name).toBe('Generation Default');
  });

  it('registers ReadmeExistsRule, GovernanceReadmeExistsRule, and ProjectDashboardExistsRule', () => {
    expect(generationDefaultProfile.rules).toHaveLength(3);
    expect(generationDefaultProfile.rules[0]).toBeInstanceOf(ReadmeExistsRule);
    expect(generationDefaultProfile.rules[1]).toBeInstanceOf(GovernanceReadmeExistsRule);
    expect(generationDefaultProfile.rules[2]).toBeInstanceOf(ProjectDashboardExistsRule);
  });

  it('preserves rule ordering', () => {
    expect(generationDefaultProfile.rules.map((rule) => rule.constructor.name)).toEqual([
      'ReadmeExistsRule',
      'GovernanceReadmeExistsRule',
      'ProjectDashboardExistsRule',
    ]);
  });

  it('exposes rules as a readonly collection', () => {
    expect(Object.keys(generationDefaultProfile)).toEqual(['id', 'name', 'description', 'rules']);
    expect([...generationDefaultProfile.rules]).toHaveLength(3);
  });
});
