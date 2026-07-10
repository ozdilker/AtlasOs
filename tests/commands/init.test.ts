import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerInitCommand } from '../../src/commands/init/index.js';
import { createInitProjectService } from '../../src/services/create-init-project-service.js';
import type {
  InitProjectExecutionResult,
  InitProjectService,
} from '../../src/services/init-project-service.js';
import { PROJECT_DIRECTORY_PATHS } from '../../src/services/init-project.js';

const tempDirectories: string[] = [];

afterEach(async () => {
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
  });
});
