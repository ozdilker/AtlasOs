import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { FilesystemTemplateLoader } from '../../src/templates/filesystem/filesystem-template-loader.js';
import { isStringTemplate } from '../../src/templates/types/string-template.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function createTempDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'atlas-filesystem-template-loader-'));
  tempDirectories.push(directory);
  return directory;
}

describe('FilesystemTemplateLoader', () => {
  it('loads markdown files from the template directory', async () => {
    const templateDirectory = await createTempDirectory();
    await writeFile(join(templateDirectory, 'README.md'), '# {{projectName}}');
    await writeFile(join(templateDirectory, 'CHANGELOG.md'), '# Changelog');

    const loader = new FilesystemTemplateLoader();
    const registrations = loader.load(templateDirectory);

    expect(registrations).toHaveLength(2);
    expect(registrations.map((registration) => registration.id).sort()).toEqual([
      'changelog',
      'readme',
    ]);
  });

  it('ignores non-markdown files', async () => {
    const templateDirectory = await createTempDirectory();
    await writeFile(join(templateDirectory, 'README.md'), '# README');
    await writeFile(join(templateDirectory, 'notes.txt'), 'plain text');
    await writeFile(join(templateDirectory, 'config.json'), '{}');

    const loader = new FilesystemTemplateLoader();
    const registrations = loader.load(templateDirectory);

    expect(registrations).toHaveLength(1);
    expect(registrations[0]?.id).toBe('readme');
  });

  it('uses lowercase filenames without extensions as template ids', async () => {
    const templateDirectory = await createTempDirectory();
    await writeFile(join(templateDirectory, 'PROJECT-DASHBOARD.md'), '# Dashboard');

    const loader = new FilesystemTemplateLoader();
    const registrations = loader.load(templateDirectory);

    expect(registrations[0]?.id).toBe('project-dashboard');
    expect(registrations[0]?.template.metadata.id).toBe('project-dashboard');
    expect(registrations[0]?.template.metadata.name).toBe('PROJECT-DASHBOARD');
  });

  it('loads file contents into string templates', async () => {
    const templateDirectory = await createTempDirectory();
    const content = '# {{projectName}}\n\nCustom README template.';
    await writeFile(join(templateDirectory, 'README.md'), content);

    const loader = new FilesystemTemplateLoader();
    const [registration] = loader.load(templateDirectory);

    expect(registration).toBeDefined();
    expect(registration?.metadata).toEqual({
      version: '1.0',
      category: 'external',
      tags: [],
    });
    expect(isStringTemplate(registration?.template ?? { metadata: { id: '', name: '' } })).toBe(
      true,
    );

    const template = registration?.template;
    if (template !== undefined && isStringTemplate(template)) {
      expect(template.content).toBe(content);
    }
  });

  it('returns an empty list for an empty directory', async () => {
    const templateDirectory = await createTempDirectory();
    const loader = new FilesystemTemplateLoader();

    expect(loader.load(templateDirectory)).toEqual([]);
  });

  it('loads markdown files from nested directories', async () => {
    const templateDirectory = await createTempDirectory();
    await mkdir(join(templateDirectory, 'docs'));
    await writeFile(join(templateDirectory, 'docs', 'GOVERNANCE.md'), '# Governance');

    const loader = new FilesystemTemplateLoader();
    const registrations = loader.load(templateDirectory);

    expect(registrations).toHaveLength(1);
    expect(registrations[0]?.id).toBe('governance');
  });
});
