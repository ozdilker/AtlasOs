import { JsonReporter } from './json-reporter.js';
import { ReporterFormat } from './reporter-format.js';
import type { Reporter } from './reporter.js';
import { TerminalReporter } from './terminal-reporter.js';

export class DuplicateReporterError extends Error {
  constructor(format: string) {
    super(`Reporter for format "${format}" is already registered.`);
    this.name = 'DuplicateReporterError';
  }
}

export class ReporterRegistry {
  private readonly reporters = new Map<string, Reporter>();

  register(format: ReporterFormat | string, reporter: Reporter): void {
    if (this.reporters.has(format)) {
      throw new DuplicateReporterError(format);
    }

    this.reporters.set(format, reporter);
  }

  get(format: ReporterFormat | string): Reporter | undefined {
    return this.reporters.get(format);
  }

  has(format: ReporterFormat | string): boolean {
    return this.reporters.has(format);
  }

  list(): readonly string[] {
    return [...this.reporters.keys()];
  }
}

export function createDefaultReporterRegistry(): ReporterRegistry {
  const registry = new ReporterRegistry();

  registry.register(ReporterFormat.Terminal, new TerminalReporter());
  registry.register(ReporterFormat.Json, new JsonReporter());

  return registry;
}
