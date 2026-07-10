import { describe, expect, it } from 'vitest';
import { createProgram } from '../src/cli.js';

describe('Atlas CLI', () => {
  it('registers only the init command', () => {
    const program = createProgram();

    expect(program.name()).toBe('atlas');
    expect(program.commands.map((command) => command.name())).toEqual(['init']);
  });

  it('exposes version 0.1.0-alpha', () => {
    const program = createProgram();

    expect(program.version()).toBe('0.2.0-alpha');
  });
});
