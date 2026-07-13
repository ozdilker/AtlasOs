import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FilesystemEntry } from '../../src/intelligence/filesystem/filesystem-entry.js';
import { FilesystemReader } from '../../src/intelligence/filesystem/filesystem-reader.js';
import { FilesystemWalker } from '../../src/intelligence/filesystem/filesystem-walker.js';
import { FilesystemInspector } from '../../src/intelligence/inspectors/filesystem-inspector.js';
import { InspectionOrigin } from '../../src/intelligence/models/inspection-origin.js';

const FIXED_TIMESTAMP = '2026-07-12T15:00:00.000Z';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function createTempDirectory(prefix: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), prefix));
  tempDirectories.push(directory);
  return directory;
}

function createInspector(
  rootDirectory: string,
  walker: FilesystemWalker,
  reader: FilesystemReader,
  now: () => string = () => FIXED_TIMESTAMP,
): FilesystemInspector {
  return new FilesystemInspector(walker, reader, now);
}

describe('FilesystemInspector', () => {
  it('creates an inspection subject from a project directory', async () => {
    const parentDirectory = await createTempDirectory('atlas-filesystem-inspector-');
    const rootDirectory = join(parentDirectory, 'AtlasProject');
    await mkdir(rootDirectory);
    await writeFile(join(rootDirectory, 'README.md'), '# Atlas Project');

    const walker = new FilesystemWalker(rootDirectory);
    const reader = new FilesystemReader();
    const inspector = createInspector(rootDirectory, walker, reader);

    const subject = inspector.inspect(rootDirectory);

    expect(subject).toEqual({
      id: 'filesystem:AtlasProject',
      origin: InspectionOrigin.Filesystem,
      projectName: 'AtlasProject',
      generatedAt: FIXED_TIMESTAMP,
      files: [
        {
          relativePath: 'README.md',
          content: '# Atlas Project',
          encoding: 'utf-8',
          size: 15,
        },
      ],
      metadata: {},
    });
  });

  it('sets origin to filesystem', async () => {
    const rootDirectory = await createTempDirectory('atlas-fs-origin-');
    await writeFile(join(rootDirectory, 'README.md'), '# Project');

    const inspector = createInspector(
      rootDirectory,
      new FilesystemWalker(rootDirectory),
      new FilesystemReader(),
    );

    expect(inspector.inspect(rootDirectory).origin).toBe(InspectionOrigin.Filesystem);
  });

  it('extracts project name from the root directory basename', async () => {
    const parentDirectory = await createTempDirectory('atlas-fs-parent-');
    const rootDirectory = join(parentDirectory, 'MyAtlasProject');
    await mkdir(rootDirectory);
    await writeFile(join(rootDirectory, 'README.md'), '# Project');

    const inspector = createInspector(
      rootDirectory,
      new FilesystemWalker(rootDirectory),
      new FilesystemReader(),
    );

    expect(inspector.inspect(rootDirectory).projectName).toBe('MyAtlasProject');
    expect(inspector.inspect(rootDirectory).id).toBe('filesystem:MyAtlasProject');
  });

  it('maps discovered files to inspection files', async () => {
    const rootDirectory = await createTempDirectory('atlas-fs-map-');
    await mkdir(join(rootDirectory, 'docs'), { recursive: true });
    await writeFile(join(rootDirectory, 'README.md'), '# Root');
    await writeFile(join(rootDirectory, 'docs', 'notes.md'), 'Notes');

    const inspector = createInspector(
      rootDirectory,
      new FilesystemWalker(rootDirectory),
      new FilesystemReader(),
    );
    const subject = inspector.inspect(rootDirectory);

    expect(subject.files.map((file) => file.relativePath)).toEqual(['docs/notes.md', 'README.md']);
    expect(subject.files[0]).toEqual({
      relativePath: 'docs/notes.md',
      content: 'Notes',
      encoding: 'utf-8',
      size: 5,
    });
  });

  it('preserves UTF-8 file content', async () => {
    const rootDirectory = await createTempDirectory('atlas-fs-utf8-');
    const content = '# Atlas\n\nUnicode: café — 日本語';
    await writeFile(join(rootDirectory, 'README.md'), content, 'utf8');

    const inspector = createInspector(
      rootDirectory,
      new FilesystemWalker(rootDirectory),
      new FilesystemReader(),
    );
    const subject = inspector.inspect(rootDirectory);

    expect(subject.files[0]?.content).toBe(content);
    expect(subject.files[0]?.encoding).toBe('utf-8');
  });

  it('invokes the walker once per inspection', async () => {
    const rootDirectory = await createTempDirectory('atlas-fs-walker-');
    await writeFile(join(rootDirectory, 'README.md'), '# Project');

    const walker = new FilesystemWalker(rootDirectory);
    const walkSpy = vi.spyOn(walker, 'walk');
    const inspector = createInspector(rootDirectory, walker, new FilesystemReader());

    inspector.inspect(rootDirectory);

    expect(walkSpy).toHaveBeenCalledOnce();
  });

  it('invokes the reader for every discovered file', async () => {
    const rootDirectory = await createTempDirectory('atlas-fs-reader-');
    await mkdir(join(rootDirectory, 'docs'), { recursive: true });
    await writeFile(join(rootDirectory, 'README.md'), '# Root');
    await writeFile(join(rootDirectory, 'docs', 'notes.md'), 'Notes');

    const entries: FilesystemEntry[] = [
      {
        relativePath: 'README.md',
        absolutePath: join(rootDirectory, 'README.md'),
      },
      {
        relativePath: 'docs/notes.md',
        absolutePath: join(rootDirectory, 'docs', 'notes.md'),
      },
    ];
    const walker = {
      walk: vi.fn(() => entries),
    } as unknown as FilesystemWalker;
    const reader = new FilesystemReader();
    const readSpy = vi.spyOn(reader, 'read');
    const inspector = createInspector(rootDirectory, walker, reader);

    inspector.inspect(rootDirectory);

    expect(readSpy).toHaveBeenCalledTimes(2);
    expect(readSpy).toHaveBeenNthCalledWith(1, join(rootDirectory, 'README.md'));
    expect(readSpy).toHaveBeenNthCalledWith(2, join(rootDirectory, 'docs', 'notes.md'));
  });
});
