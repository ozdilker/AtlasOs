import { access, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { generateReadme } from '../../src/services/generate-readme.js';
import {
  InitProjectError,
  PROJECT_DIRECTORY_PATHS,
  PROJECT_ROOT_FILES,
  createEmptyRootFilesIfMissing,
  initProject,
  writeProjectReadmeIfMissing,
} from '../../src/services/init-project.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function createTempDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'atlas-init-'));
  tempDirectories.push(directory);
  return directory;
}

describe('initProject', () => {
  it('creates the expected directories and root files', async () => {
    const baseDirectory = await createTempDirectory();
    const projectName = 'MyProject';

    const result = await initProject(projectName, baseDirectory);

    const projectRoot = join(baseDirectory, projectName);

    for (const relativePath of PROJECT_DIRECTORY_PATHS) {
      const directoryPath = join(projectRoot, relativePath);
      const directoryStat = await stat(directoryPath);
      expect(directoryStat.isDirectory()).toBe(true);
    }

    const projectEntries = await readdir(projectRoot, { withFileTypes: true });
    expect(
      projectEntries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort(),
    ).toEqual(['.atlas', 'docs']);
    expect(
      projectEntries
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .sort(),
    ).toEqual(['.gitignore', 'CHANGELOG.md', 'README.md']);

    expect(result.filesCreated.sort()).toEqual([...PROJECT_ROOT_FILES].sort());
    expect(result.filesSkipped).toEqual([]);
  });

  it('generates README content and keeps other root files empty', async () => {
    const baseDirectory = await createTempDirectory();
    const projectName = 'MyProject';

    await initProject(projectName, baseDirectory);

    const projectRoot = join(baseDirectory, projectName);

    expect(await readFile(join(projectRoot, 'README.md'), 'utf8')).toBe(
      generateReadme(projectName),
    );
    expect(await readFile(join(projectRoot, 'CHANGELOG.md'), 'utf8')).toBe('');
    expect(await readFile(join(projectRoot, '.gitignore'), 'utf8')).toBe('');
  });

  it('does not create files inside scaffold directories', async () => {
    const baseDirectory = await createTempDirectory();
    const projectName = 'MyProject';

    await initProject(projectName, baseDirectory);

    const projectRoot = join(baseDirectory, projectName);
    const docsGovernance = join(projectRoot, 'docs', '00-governance');
    const atlasDirectory = join(projectRoot, '.atlas');

    await expect(access(join(docsGovernance, '.gitkeep'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(access(join(atlasDirectory, 'config.json'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('fails when the project directory already exists', async () => {
    const baseDirectory = await createTempDirectory();
    const projectName = 'MyProject';

    await initProject(projectName, baseDirectory);

    await expect(initProject(projectName, baseDirectory)).rejects.toThrow(InitProjectError);
    await expect(initProject(projectName, baseDirectory)).rejects.toThrow(
      'Project directory "MyProject" already exists.',
    );
  });
});

describe('createEmptyRootFilesIfMissing', () => {
  it('does not overwrite existing empty root files', async () => {
    const baseDirectory = await createTempDirectory();
    const projectRoot = join(baseDirectory, 'MyProject');

    await mkdir(projectRoot, { recursive: true });
    await writeFile(join(projectRoot, 'CHANGELOG.md'), 'existing content', 'utf8');

    const result = await createEmptyRootFilesIfMissing(projectRoot);

    expect(result.skipped).toEqual(['CHANGELOG.md']);
    expect(result.created).toEqual(['.gitignore']);
    expect(await readFile(join(projectRoot, 'CHANGELOG.md'), 'utf8')).toBe('existing content');
    expect(await readFile(join(projectRoot, '.gitignore'), 'utf8')).toBe('');
  });
});

describe('writeProjectReadmeIfMissing', () => {
  it('does not overwrite an existing README', async () => {
    const baseDirectory = await createTempDirectory();
    const projectRoot = join(baseDirectory, 'MyProject');

    await mkdir(projectRoot, { recursive: true });
    await writeFile(join(projectRoot, 'README.md'), 'existing content', 'utf8');

    const result = await writeProjectReadmeIfMissing(projectRoot, 'MyProject');

    expect(result).toBe('skipped');
    expect(await readFile(join(projectRoot, 'README.md'), 'utf8')).toBe('existing content');
  });
});
