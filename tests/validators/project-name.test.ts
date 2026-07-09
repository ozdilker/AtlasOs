import { describe, expect, it } from 'vitest';
import { validateProjectName } from '../../src/validators/project-name.js';

describe('validateProjectName', () => {
  it('accepts valid PascalCase names', () => {
    expect(validateProjectName('MyProject')).toBeNull();
    expect(validateProjectName('AtlasOS')).toBeNull();
  });

  it('rejects empty names', () => {
    expect(validateProjectName('')).toBe('Project name is required.');
  });

  it('rejects invalid characters and formats', () => {
    expect(validateProjectName('my-project')).not.toBeNull();
    expect(validateProjectName('My Project')).not.toBeNull();
    expect(validateProjectName('../Escape')).not.toBeNull();
  });

  it('rejects reserved Windows device names', () => {
    expect(validateProjectName('CON')).toBe(
      'Project name "CON" is reserved by the operating system.',
    );
  });
});
