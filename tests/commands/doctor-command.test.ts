import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Command } from 'commander';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../src/cli.js';
import { registerDoctorCommand } from '../../src/commands/doctor/index.js';
import type { AtlasConfigLoader } from '../../src/config/atlas-config-loader.js';
import { DiagnosticSeverity } from '../../src/diagnostics/diagnostic-severity.js';
import { createDoctorService } from '../../src/intelligence/doctor/create-doctor-service.js';
import type { DoctorResult } from '../../src/intelligence/doctor/doctor-result.js';
import type { DoctorService } from '../../src/intelligence/doctor/doctor-service.js';
import { ReporterFormat } from '../../src/intelligence/reporters/reporter-format.js';
import {
  type ReporterRegistry,
  createDefaultReporterRegistry,
} from '../../src/intelligence/reporters/reporter-registry.js';
import type { Reporter } from '../../src/intelligence/reporters/reporter.js';
import { TerminalReporter } from '../../src/intelligence/reporters/terminal-reporter.js';
import { createValidationEngineResult } from '../../src/intelligence/validation/validation-engine-result.js';

function createDoctorResult(overrides: Partial<DoctorResult> = {}): DoctorResult {
  const validationResult = createValidationEngineResult([], 5, 5);

  return {
    report: 'Atlas Doctor Report\n\nStatus:\nPASS',
    validationResult,
    ...overrides,
  };
}

async function createValidProjectDirectory(): Promise<string> {
  const rootDirectory = await mkdtemp(join(tmpdir(), 'atlas-doctor-command-'));
  tempDirectories.push(rootDirectory);
  await writeFile(join(rootDirectory, 'README.md'), '# Project');
  await writeFile(join(rootDirectory, 'CHANGELOG.md'), '# Changelog');
  await writeFile(join(rootDirectory, 'PROJECT-DASHBOARD.md'), '# Dashboard');
  await mkdir(join(rootDirectory, 'docs', '00-governance'), { recursive: true });
  await writeFile(join(rootDirectory, 'docs', '00-governance', 'README.md'), '# Governance');
  await writeFile(join(rootDirectory, '.gitignore'), '');

  return rootDirectory;
}

async function writeAtlasConfig(directory: string, config: unknown): Promise<void> {
  await writeFile(join(directory, 'atlas.config.json'), JSON.stringify(config, null, 2), 'utf8');
}

function registerDoctorCommandWithDefaults(
  program: Command,
  overrides: {
    createService?: (reporter: Reporter) => DoctorService;
    createReporterRegistry?: () => ReporterRegistry;
    createConfigLoader?: () => AtlasConfigLoader;
    writeStdout?: (output: string) => boolean;
    writeStderr?: (output: string) => boolean;
  } = {},
): void {
  registerDoctorCommand(
    program,
    overrides.createService,
    overrides.createReporterRegistry,
    overrides.createConfigLoader,
    overrides.writeStdout,
    overrides.writeStderr,
  );
}

const tempDirectories: string[] = [];

afterEach(async () => {
  process.exitCode = 0;
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('doctor command', () => {
  it('registers the doctor command on the CLI program', () => {
    const program = createProgram();

    expect(program.commands.map((command) => command.name())).toContain('doctor');
  });

  it('invokes DoctorService with the provided path', () => {
    const run = vi.fn(() => createDoctorResult());
    const service = { run } as unknown as DoctorService;
    const program = new Command();
    registerDoctorCommand(program, () => service);

    program.parse(['doctor', './my-project'], { from: 'user' });

    expect(run).toHaveBeenCalledOnce();
    expect(run).toHaveBeenCalledWith('./my-project');
  });

  it('defaults the path to the current directory', () => {
    const run = vi.fn(() => createDoctorResult());
    const service = { run } as unknown as DoctorService;
    const program = new Command();
    registerDoctorCommand(program, () => service);

    program.parse(['doctor'], { from: 'user' });

    expect(run).toHaveBeenCalledWith('.');
  });

  it('uses terminal output when config is missing', async () => {
    const rootDirectory = await createValidProjectDirectory();
    const writeStdout = vi.fn(() => true);
    const program = new Command();
    registerDoctorCommandWithDefaults(program, {
      createService: createDoctorService,
      writeStdout,
    });

    program.parse(['doctor', rootDirectory], { from: 'user' });

    expect(String(writeStdout.mock.calls[0]?.[0])).toContain('Atlas Doctor Report');
    expect(process.exitCode).toBe(0);
  });

  it('uses the configured doctor format when no CLI format is provided', async () => {
    const rootDirectory = await createValidProjectDirectory();
    await writeAtlasConfig(rootDirectory, {
      doctor: {
        format: 'json',
      },
    });
    const writeStdout = vi.fn(() => true);
    const program = new Command();
    registerDoctorCommandWithDefaults(program, {
      createService: createDoctorService,
      writeStdout,
    });

    program.parse(['doctor', rootDirectory], { from: 'user' });

    const report = JSON.parse(String(writeStdout.mock.calls[0]?.[0])) as {
      schemaVersion: string;
      status: string;
    };

    expect(report.schemaVersion).toBe('1.0');
    expect(report.status).toBe('pass');
  });

  it('lets CLI format override configured doctor format', async () => {
    const rootDirectory = await createValidProjectDirectory();
    await writeAtlasConfig(rootDirectory, {
      doctor: {
        format: 'json',
      },
    });
    const writeStdout = vi.fn(() => true);
    const program = new Command();
    registerDoctorCommandWithDefaults(program, {
      createService: createDoctorService,
      writeStdout,
    });

    program.parse(['doctor', rootDirectory, '--format', 'terminal'], { from: 'user' });

    expect(String(writeStdout.mock.calls[0]?.[0])).toContain('Atlas Doctor Report');
    expect(String(writeStdout.mock.calls[0]?.[0])).not.toContain('"schemaVersion"');
  });

  it('reports an unknown format from configuration', async () => {
    const rootDirectory = await createValidProjectDirectory();
    await writeAtlasConfig(rootDirectory, {
      doctor: {
        format: 'markdown',
      },
    });
    const writeStderr = vi.fn(() => true);
    const program = new Command();
    registerDoctorCommandWithDefaults(program, {
      createService: createDoctorService,
      writeStderr,
    });

    program.parse(['doctor', rootDirectory], { from: 'user' });

    expect(writeStderr).toHaveBeenCalledWith('Unknown reporter format: markdown\n');
    expect(process.exitCode).toBe(1);
  });

  it('resolves the reporter from ReporterRegistry using the effective format', async () => {
    const rootDirectory = await createValidProjectDirectory();
    await writeAtlasConfig(rootDirectory, {
      doctor: {
        format: 'json',
      },
    });
    const registry = createDefaultReporterRegistry();
    const getSpy = vi.spyOn(registry, 'get');
    const writeStdout = vi.fn(() => true);
    const program = new Command();
    registerDoctorCommandWithDefaults(program, {
      createService: createDoctorService,
      createReporterRegistry: () => registry,
      writeStdout,
    });

    program.parse(['doctor', rootDirectory], { from: 'user' });

    expect(getSpy).toHaveBeenCalledWith('json');
  });

  it('writes the terminal report to stdout by default', () => {
    const run = vi.fn(() => createDoctorResult());
    const service = { run } as unknown as DoctorService;
    const writeStdout = vi.fn(() => true);
    const program = new Command();
    registerDoctorCommandWithDefaults(program, {
      createService: () => service,
      writeStdout,
    });

    program.parse(['doctor'], { from: 'user' });

    expect(writeStdout).toHaveBeenCalledWith('Atlas Doctor Report\n\nStatus:\nPASS');
    expect(process.exitCode).toBe(0);
  });

  it('resolves the terminal reporter from ReporterRegistry when format is terminal', async () => {
    const rootDirectory = await createValidProjectDirectory();
    const registry = createDefaultReporterRegistry();
    const getSpy = vi.spyOn(registry, 'get');
    const writeStdout = vi.fn(() => true);
    const program = new Command();
    registerDoctorCommandWithDefaults(program, {
      createService: createDoctorService,
      createReporterRegistry: () => registry,
      writeStdout,
    });

    program.parse(['doctor', rootDirectory, '--format', 'terminal'], { from: 'user' });

    expect(getSpy).toHaveBeenCalledWith(ReporterFormat.Terminal);
    expect(String(writeStdout.mock.calls[0]?.[0])).toContain('Atlas Doctor Report');
    expect(process.exitCode).toBe(0);
  });

  it('writes JSON output when format is json', async () => {
    const rootDirectory = await createValidProjectDirectory();
    const writeStdout = vi.fn(() => true);
    const program = new Command();
    registerDoctorCommandWithDefaults(program, {
      createService: createDoctorService,
      writeStdout,
    });

    program.parse(['doctor', rootDirectory, '--format', 'json'], { from: 'user' });

    const report = JSON.parse(String(writeStdout.mock.calls[0]?.[0])) as {
      schemaVersion: string;
      status: string;
    };

    expect(report.schemaVersion).toBe('1.0');
    expect(report.status).toBe('pass');
    expect(process.exitCode).toBe(0);
  });

  it('prints an error and exits with code 1 for an unknown format', () => {
    const run = vi.fn(() => createDoctorResult());
    const service = { run } as unknown as DoctorService;
    const writeStderr = vi.fn(() => true);
    const program = new Command();
    registerDoctorCommandWithDefaults(program, {
      createService: () => service,
      writeStdout: vi.fn(() => true),
      writeStderr,
    });

    program.parse(['doctor', '--format', 'markdown'], { from: 'user' });

    expect(writeStderr).toHaveBeenCalledWith('Unknown reporter format: markdown\n');
    expect(run).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('looks up the reporter from ReporterRegistry using the requested format', () => {
    const run = vi.fn(() => createDoctorResult());
    const service = { run } as unknown as DoctorService;
    const reporter = new TerminalReporter();
    const registry = {
      get: vi.fn(() => reporter),
      has: vi.fn(),
      list: vi.fn(() => []),
      register: vi.fn(),
    } as unknown as ReporterRegistry;
    const program = new Command();
    registerDoctorCommandWithDefaults(program, {
      createService: () => service,
      createReporterRegistry: () => registry,
    });

    program.parse(['doctor', '--format', 'terminal'], { from: 'user' });

    expect(registry.get).toHaveBeenCalledWith('terminal');
  });

  it('sets exit code 1 when validation reports errors', () => {
    const run = vi.fn(() =>
      createDoctorResult({
        report: JSON.stringify({ status: 'fail' }),
        validationResult: createValidationEngineResult(
          [
            {
              code: 'README_MISSING',
              severity: DiagnosticSeverity.Error,
              message: 'Project is missing required file "README.md".',
              path: 'README.md',
            },
          ],
          5,
          5,
        ),
      }),
    );
    const service = { run } as unknown as DoctorService;
    const program = new Command();
    registerDoctorCommand(program, () => service);

    program.parse(['doctor', '--format', 'json'], { from: 'user' });

    expect(process.exitCode).toBe(1);
  });

  it('preserves validation exit codes when using the json reporter', async () => {
    const rootDirectory = await createValidProjectDirectory();
    await rm(join(rootDirectory, 'README.md'));
    const writeStdout = vi.fn(() => true);
    const program = new Command();
    registerDoctorCommandWithDefaults(program, {
      createService: createDoctorService,
      writeStdout,
    });

    program.parse(['doctor', rootDirectory, '--format', 'json'], { from: 'user' });

    const report = JSON.parse(String(writeStdout.mock.calls[0]?.[0])) as { status: string };
    expect(report.status).toBe('fail');
    expect(process.exitCode).toBe(1);
  });
});
