import { describe, expect, it } from 'vitest';
import {
  GENERATION_DEFAULT_PROFILE_ID,
  generationDefaultProfile,
} from '../../src/intelligence/profiles/generation-default-profile.js';
import { ReadmeExistsRule } from '../../src/intelligence/rules/readme-exists-rule.js';

describe('generationDefaultProfile', () => {
  it('defines the generation-default profile id', () => {
    expect(GENERATION_DEFAULT_PROFILE_ID).toBe('generation-default');
    expect(generationDefaultProfile.id).toBe('generation-default');
  });

  it('defines a human-readable profile name', () => {
    expect(generationDefaultProfile.name).toBe('Generation Default');
  });

  it('contains ReadmeExistsRule as its only rule', () => {
    expect(generationDefaultProfile.rules).toHaveLength(1);
    expect(generationDefaultProfile.rules[0]).toBeInstanceOf(ReadmeExistsRule);
  });

  it('exposes rules as a readonly collection', () => {
    expect(Object.keys(generationDefaultProfile)).toEqual(['id', 'name', 'description', 'rules']);
    expect([...generationDefaultProfile.rules]).toHaveLength(1);
    expect(generationDefaultProfile.rules[0]).toBeInstanceOf(ReadmeExistsRule);
  });
});
