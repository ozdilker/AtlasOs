import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { FilesystemWalker } from '../../src/intelligence/filesystem/filesystem-walker.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function createTempDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'atlas-filesystem-walker-'));
  tempDirectories.push(directory);
  return directory;
}

describe('FilesystemWalker', () => {
  it('returns no entries for an empty directory', async () => {
    const rootDirectory = await createTempDirectory();
    const walker = new FilesystemWalker(rootDirectory);

    expect(walker.walk()).toEqual([]);
  });

  it('returns files from nested directories', async () => {
    const rootDirectory = await createTempDirectory();
    await mkdir(join(rootDirectory, 'docs', '00-governance'), { recursive: true });
    await writeFile(join(rootDirectory, 'README.md'), '# Project');
    await writeFile(join(rootDirectory, 'docs', '00-governance', 'README.md'), '# Governance');

    const walker = new FilesystemWalker(rootDirectory);
    const entries = walker.walk();

    expect(entries).toHaveLength(2);
    expect(entries.map((entry) => entry.relativePath)).toEqual([
      'docs/00-governance/README.md',
      'README.md',
    ]);
  });

  it('returns entries sorted alphabetically by relativePath', async () => {
    const rootDirectory = await createTempDirectory();
    await writeFile(join(rootDirectory, 'z.txt'), 'z');
    await writeFile(join(rootDirectory, 'a.txt'), 'a');
    await mkdir(join(rootDirectory, 'nested'), { recursive: true });
    await writeFile(join(rootDirectory, 'nested', 'm.txt'), 'm');

    const walker = new FilesystemWalker(rootDirectory);
    const entries = walker.walk();

    expect(entries.map((entry) => entry.relativePath)).toEqual(['a.txt', 'nested/m.txt', 'z.txt']);
  });

  it('generates posix relative paths and absolute paths', async () => {
    const rootDirectory = await createTempDirectory();
    await mkdir(join(rootDirectory, 'docs'), { recursive: true });
    await writeFile(join(rootDirectory, 'docs', 'notes.txt'), 'notes');

    const walker = new FilesystemWalker(rootDirectory);
    const [entry] = walker.walk();

    expect(entry?.relativePath).toBe('docs/notes.txt');
    expect(entry?.absolutePath).toBe(join(rootDirectory, 'docs', 'notes.txt'));
    expect(entry?.relativePath).not.toContain('\\');
  });

  it('ignores files inside .git', async () => {
    const rootDirectory = await createTempDirectory();
    await mkdir(join(rootDirectory, '.git'), { recursive: true });
    await writeFile(join(rootDirectory, 'README.md'), '# Project');
    await writeFile(join(rootDirectory, '.git', 'config'), 'git config');

    const walker = new FilesystemWalker(rootDirectory);
    const entries = walker.walk();

    expect(entries).toEqual([
      {
        relativePath: 'README.md',
        absolutePath: join(rootDirectory, 'README.md'),
      },
    ]);
  });

  it('ignores files inside node_modules', async () => {
    const rootDirectory = await createTempDirectory();
    await mkdir(join(rootDirectory, 'node_modules', 'pkg'), { recursive: true });
    await writeFile(join(rootDirectory, 'package.json'), '{}');
    await writeFile(join(rootDirectory, 'node_modules', 'pkg', 'index.js'), 'module.exports = {};');

    const walker = new FilesystemWalker(rootDirectory);
    const entries = walker.walk();

    expect(entries).toEqual([
      {
        relativePath: 'package.json',
        absolutePath: join(rootDirectory, 'package.json'),
      },
    ]);
  });

  it('ignores files inside dist', async () => {
    const rootDirectory = await createTempDirectory();
    await mkdir(join(rootDirectory, 'dist'), { recursive: true });
    await mkdir(join(rootDirectory, 'src'), { recursive: true });
    await writeFile(join(rootDirectory, 'src', 'index.ts'), 'export {};');
    await writeFile(join(rootDirectory, 'dist', 'index.js'), 'exports = {};');

    const walker = new FilesystemWalker(rootDirectory);
    const entries = walker.walk();

    expect(entries).toEqual([
      {
        relativePath: 'src/index.ts',
        absolutePath: join(rootDirectory, 'src', 'index.ts'),
      },
    ]);
  });

  it('does not return directories', async () => {
    const rootDirectory = await createTempDirectory();
    await mkdir(join(rootDirectory, 'docs', '00-governance'), { recursive: true });
    await writeFile(join(rootDirectory, 'README.md'), '# Project');

    const walker = new FilesystemWalker(rootDirectory);
    const entries = walker.walk();

    expect(entries).toEqual([
      {
        relativePath: 'README.md',
        absolutePath: join(rootDirectory, 'README.md'),
      },
    ]);
  });
});
