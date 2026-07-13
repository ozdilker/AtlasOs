import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerInitCommand } from '../../src/commands/init/index.js';
import { DiagnosticSeverity } from '../../src/diagnostics/diagnostic-severity.js';
import { createValidationResult } from '../../src/diagnostics/validation-result.js';
import { createInitProjectService } from '../../src/services/create-init-project-service.js';
import type {
  InitProjectExecutionResult,
  InitProjectService,
} from '../../src/services/init-project-service.js';
import { PROJECT_DIRECTORY_PATHS } from '../../src/services/init-project.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  process.exitCode = 0;
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function createTempDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'atlas-init-command-'));
  tempDirectories.push(directory);
  return directory;
}

describe('init command', () => {
  it('creates a project successfully through the init command flow', async () => {
    const execute = vi.fn(
      async (): Promise<InitProjectExecutionResult> => ({
        projectName: 'MyProject',
        directories: [...PROJECT_DIRECTORY_PATHS],
        filesCreated: [
          'README.md',
          'CHANGELOG.md',
          'PROJECT-DASHBOARD.md',
          'docs/00-governance/README.md',
          '.gitignore',
        ],
        filesSkipped: [],
        validation: createValidationResult([]),
      }),
    );

    const service = { execute } as unknown as InitProjectService;
    const program = new Command();
    registerInitCommand(program, () => service);

    await program.parseAsync(['init', 'MyProject'], { from: 'user' });

    expect(execute).toHaveBeenCalledWith('MyProject');
  });

  it('integrates pipeline and file service for atlas init', async () => {
    const baseDirectory = await createTempDirectory();
    const service = createInitProjectService(baseDirectory);
    const pipeline = Reflect.get(service, 'pipeline') as { generate: (name: string) => unknown };
    const fileService = Reflect.get(service, 'fileService') as {
      write: (base: string, result: unknown) => Promise<unknown>;
    };

    const generateSpy = vi.spyOn(pipeline, 'generate');
    const writeSpy = vi.spyOn(fileService, 'write');

    await service.execute('MyProject');

    expect(generateSpy).toHaveBeenCalledOnce();
    expect(writeSpy).toHaveBeenCalledOnce();

    const projectRoot = join(baseDirectory, 'MyProject');
    expect(await readFile(join(projectRoot, 'README.md'), 'utf8')).toContain('MyProject');

    for (const relativePath of PROJECT_DIRECTORY_PATHS) {
      const directoryStat = await stat(join(projectRoot, relativePath));
      expect(directoryStat.isDirectory()).toBe(true);
    }

    expect(await readFile(join(projectRoot, 'CHANGELOG.md'), 'utf8')).toBe(`# Changelog

Initial release.`);
    expect(await readFile(join(projectRoot, 'PROJECT-DASHBOARD.md'), 'utf8')).toContain(
      'Project Dashboard',
    );
    expect(await readFile(join(projectRoot, 'docs/00-governance/README.md'), 'utf8')).toContain(
      'Governance',
    );
    expect(await readFile(join(projectRoot, '.gitignore'), 'utf8')).toBe('');
  });

  it('does not use legacy init-project orchestration', () => {
    const currentDirectory = dirname(fileURLToPath(import.meta.url));
    const initProjectSource = readFileSync(
      join(currentDirectory, '../../src/services/init-project.ts'),
      'utf8',
    );
    const initCommandSource = readFileSync(
      join(currentDirectory, '../../src/commands/init/index.ts'),
      'utf8',
    );

    expect(initProjectSource).not.toMatch(/\binitProject\b/);
    expect(initProjectSource).not.toMatch(/node:fs/);
    expect(initCommandSource).not.toMatch(/initProject\(/);
    expect(initCommandSource).toContain('InitProjectService');
    expect(initCommandSource).toContain('formatInitValidationSummary');
  });

  it('prints validation success after project creation', async () => {
    const execute = vi.fn(
      async (): Promise<InitProjectExecutionResult> => ({
        projectName: 'MyProject',
        directories: [...PROJECT_DIRECTORY_PATHS],
        filesCreated: ['README.md'],
        filesSkipped: [],
        validation: createValidationResult([]),
      }),
    );

    const service = { execute } as unknown as InitProjectService;
    const program = new Command();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    registerInitCommand(program, () => service);

    await program.parseAsync(['init', 'MyProject'], { from: 'user' });

    expect(logSpy).toHaveBeenCalledWith(
      '------------------------------------\n✔ Validation passed.',
    );
    logSpy.mockRestore();
  });

  it('prints validation warnings without changing exit code', async () => {
    const execute = vi.fn(
      async (): Promise<InitProjectExecutionResult> => ({
        projectName: 'MyProject',
        directories: [...PROJECT_DIRECTORY_PATHS],
        filesCreated: ['README.md'],
        filesSkipped: [],
        validation: createValidationResult([
          {
            code: 'TEMPLATE_WARNING',
            severity: DiagnosticSeverity.Warning,
            message: 'Template uses deprecated placeholder.',
            path: 'README.md',
          },
        ]),
      }),
    );

    const service = { execute } as unknown as InitProjectService;
    const program = new Command();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    registerInitCommand(program, () => service);

    await program.parseAsync(['init', 'MyProject'], { from: 'user' });

    expect(process.exitCode).not.toBe(1);
    expect(logSpy).toHaveBeenCalledWith(
      [
        '------------------------------------',
        'Warnings:',
        '',
        'README.md: Template uses deprecated placeholder.',
      ].join('\n'),
    );
    logSpy.mockRestore();
  });

  it('prints validation errors without failing init or changing exit code', async () => {
    const execute = vi.fn(
      async (): Promise<InitProjectExecutionResult> => ({
        projectName: 'MyProject',
        directories: [...PROJECT_DIRECTORY_PATHS],
        filesCreated: ['README.md'],
        filesSkipped: [],
        validation: createValidationResult([
          {
            code: 'README_MISSING',
            severity: DiagnosticSeverity.Error,
            message: 'README.md is required but missing.',
            path: 'README.md',
          },
        ]),
      }),
    );

    const service = { execute } as unknown as InitProjectService;
    const program = new Command();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    registerInitCommand(program, () => service);

    await program.parseAsync(['init', 'MyProject'], { from: 'user' });

    expect(execute).toHaveBeenCalledWith('MyProject');
    expect(process.exitCode).not.toBe(1);
    expect(logSpy).toHaveBeenCalledWith(
      [
        '------------------------------------',
        'Errors:',
        '',
        'README.md: README.md is required but missing.',
      ].join('\n'),
    );
    logSpy.mockRestore();
  });

  it('prints validation success for a real init run', async () => {
    const baseDirectory = await createTempDirectory();
    const service = createInitProjectService(baseDirectory);
    const program = new Command();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    registerInitCommand(program, () => service);

    await program.parseAsync(['init', 'MyProject'], { from: 'user' });

    expect(logSpy).toHaveBeenCalledWith(
      '------------------------------------\n✔ Validation passed.',
    );
    logSpy.mockRestore();
  });
});
