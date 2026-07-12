import { describe, expect, it } from 'vitest';
import {
  GENERATION_DEFAULT_PROFILE_ID,
  generationDefaultProfile,
} from '../../src/intelligence/profiles/generation-default-profile.js';
import { GovernanceReadmeExistsRule } from '../../src/intelligence/rules/governance-readme-exists-rule.js';
import { ReadmeExistsRule } from '../../src/intelligence/rules/readme-exists-rule.js';

describe('generationDefaultProfile', () => {
  it('defines the generation-default profile id', () => {
    expect(GENERATION_DEFAULT_PROFILE_ID).toBe('generation-default');
    expect(generationDefaultProfile.id).toBe('generation-default');
  });

  it('defines a human-readable profile name', () => {
    expect(generationDefaultProfile.name).toBe('Generation Default');
  });

  it('contains ReadmeExistsRule and GovernanceReadmeExistsRule', () => {
    expect(generationDefaultProfile.rules).toHaveLength(2);
    expect(generationDefaultProfile.rules[0]).toBeInstanceOf(ReadmeExistsRule);
    expect(generationDefaultProfile.rules[1]).toBeInstanceOf(GovernanceReadmeExistsRule);
  });

  it('preserves rule ordering with readme validation first', () => {
    expect(generationDefaultProfile.rules.map((rule) => rule.constructor.name)).toEqual([
      'ReadmeExistsRule',
      'GovernanceReadmeExistsRule',
    ]);
  });

  it('exposes rules as a readonly collection', () => {
    expect(Object.keys(generationDefaultProfile)).toEqual(['id', 'name', 'description', 'rules']);
    expect([...generationDefaultProfile.rules]).toHaveLength(2);
  });
});
