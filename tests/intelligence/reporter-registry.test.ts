import { describe, expect, it } from 'vitest';
import { JsonReporter } from '../../src/intelligence/reporters/json-reporter.js';
import { ReporterFormat } from '../../src/intelligence/reporters/reporter-format.js';
import {
  DuplicateReporterError,
  ReporterRegistry,
  createDefaultReporterRegistry,
} from '../../src/intelligence/reporters/reporter-registry.js';
import { Reporter } from '../../src/intelligence/reporters/reporter.js';
import { TerminalReporter } from '../../src/intelligence/reporters/terminal-reporter.js';

class SampleReporter extends Reporter {
  report(): string {
    return 'sample-report';
  }
}

describe('ReporterRegistry', () => {
  it('registers and resolves a reporter by format', () => {
    const registry = new ReporterRegistry();
    const reporter = new SampleReporter();

    registry.register(ReporterFormat.Terminal, reporter);

    expect(registry.get(ReporterFormat.Terminal)).toBe(reporter);
    expect(registry.has(ReporterFormat.Terminal)).toBe(true);
  });

  it('returns undefined for an unknown reporter format', () => {
    const registry = new ReporterRegistry();

    expect(registry.get('markdown')).toBeUndefined();
    expect(registry.has('markdown')).toBe(false);
  });

  it('lists all registered formats', () => {
    const registry = new ReporterRegistry();
    const terminalReporter = new TerminalReporter();
    const jsonReporter = new JsonReporter();

    registry.register(ReporterFormat.Terminal, terminalReporter);
    registry.register(ReporterFormat.Json, jsonReporter);

    expect(registry.list()).toEqual([ReporterFormat.Terminal, ReporterFormat.Json]);
  });

  it('rejects duplicate format registrations with a descriptive error', () => {
    const registry = new ReporterRegistry();

    registry.register(ReporterFormat.Json, new JsonReporter());

    expect(() => registry.register(ReporterFormat.Json, new JsonReporter())).toThrow(
      DuplicateReporterError,
    );
    expect(() => registry.register(ReporterFormat.Json, new JsonReporter())).toThrow(
      'Reporter for format "json" is already registered.',
    );
    expect(registry.list()).toHaveLength(1);
  });

  it('creates a default registry with terminal and json reporters', () => {
    const registry = createDefaultReporterRegistry();

    expect(registry.has(ReporterFormat.Terminal)).toBe(true);
    expect(registry.has(ReporterFormat.Json)).toBe(true);
    expect(registry.list()).toEqual([ReporterFormat.Terminal, ReporterFormat.Json]);
    expect(registry.get(ReporterFormat.Terminal)).toBeInstanceOf(TerminalReporter);
    expect(registry.get(ReporterFormat.Json)).toBeInstanceOf(JsonReporter);
  });
});
