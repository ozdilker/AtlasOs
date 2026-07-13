import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createDefaultConfig } from '../../src/config/create-default-config.js';
import { resolveTemplateDirectory } from '../../src/templates/config/template-directory-resolver.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function createTempDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'atlas-template-directory-'));
  tempDirectories.push(directory);
  return directory;
}

describe('resolveTemplateDirectory', () => {
  it('resolves the default templates directory relative to the project root', () => {
    const projectRoot = '/workspace/MyProject';
    const config = createDefaultConfig();

    const result = resolveTemplateDirectory(projectRoot, config);

    expect(result).toEqual({
      exists: false,
      directory: resolve(projectRoot, './templates'),
    });
  });

  it('resolves a configured templates directory relative to the project root', () => {
    const projectRoot = '/workspace/MyProject';
    const config = {
      ...createDefaultConfig(),
      templates: {
        directory: './custom-templates',
      },
    };

    const result = resolveTemplateDirectory(projectRoot, config);

    expect(result).toEqual({
      exists: false,
      directory: resolve(projectRoot, './custom-templates'),
    });
  });

  it('reports exists true when the configured directory is present', async () => {
    const projectRoot = await createTempDirectory();
    const templatesDirectory = join(projectRoot, 'templates');
    await mkdir(templatesDirectory);

    const result = resolveTemplateDirectory(projectRoot, createDefaultConfig());

    expect(result).toEqual({
      exists: true,
      directory: templatesDirectory,
    });
  });

  it('reports exists false when the configured directory is missing', async () => {
    const projectRoot = await createTempDirectory();

    const result = resolveTemplateDirectory(projectRoot, createDefaultConfig());

    expect(result.exists).toBe(false);
    expect(result.directory).toBe(join(projectRoot, 'templates'));
  });

  it('signals fallback to built-in templates when the path is not a directory', async () => {
    const projectRoot = await createTempDirectory();
    await writeFile(join(projectRoot, 'templates'), 'not a directory');

    const result = resolveTemplateDirectory(projectRoot, createDefaultConfig());

    expect(result).toEqual({
      exists: false,
      directory: join(projectRoot, 'templates'),
    });
  });
});
