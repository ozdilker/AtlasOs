import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { AtlasConfigLoader } from '../../src/config/atlas-config-loader.js';
import { createDefaultConfig } from '../../src/config/create-default-config.js';

const tempDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function createTempDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'atlas-config-loader-'));
  tempDirectories.push(directory);
  return directory;
}

async function writeConfig(directory: string, config: unknown): Promise<void> {
  await writeFile(join(directory, 'atlas.config.json'), JSON.stringify(config, null, 2), 'utf8');
}

describe('AtlasConfigLoader', () => {
  it('returns defaults when atlas.config.json is missing', async () => {
    const directory = await createTempDirectory();
    const loader = new AtlasConfigLoader();

    const config = loader.load(directory);

    expect(config).toEqual(createDefaultConfig());
  });

  it('merges a partial config with defaults', async () => {
    const directory = await createTempDirectory();
    await writeConfig(directory, {
      doctor: {
        format: 'json',
      },
    });
    const loader = new AtlasConfigLoader();

    const config = loader.load(directory);

    expect(config).toEqual({
      project: {},
      doctor: {
        profile: 'generation-default',
        format: 'json',
      },
      templates: {
        directory: './templates',
      },
    });
  });

  it('loads a full config file', async () => {
    const directory = await createTempDirectory();
    await writeConfig(directory, {
      project: {
        name: 'AtlasProject',
      },
      doctor: {
        profile: 'project-standard',
        format: 'json',
      },
      templates: {
        directory: './custom-templates',
      },
    });
    const loader = new AtlasConfigLoader();

    const config = loader.load(directory);

    expect(config).toEqual({
      project: {
        name: 'AtlasProject',
      },
      doctor: {
        profile: 'project-standard',
        format: 'json',
      },
      templates: {
        directory: './custom-templates',
      },
    });
  });

  it('deep merges nested configuration objects', async () => {
    const directory = await createTempDirectory();
    await writeConfig(directory, {
      doctor: {
        format: 'json',
      },
      templates: {
        directory: './project-templates',
      },
    });
    const loader = new AtlasConfigLoader();

    const config = loader.load(directory);

    expect(config.doctor).toEqual({
      profile: 'generation-default',
      format: 'json',
    });
    expect(config.templates).toEqual({
      directory: './project-templates',
    });
    expect(config.project).toEqual({});
  });

  it('preserves unknown fields from the config file', async () => {
    const directory = await createTempDirectory();
    await writeConfig(directory, {
      doctor: {
        format: 'terminal',
        futureOption: 'enabled',
      },
      experimental: {
        enabled: true,
      },
    });
    const loader = new AtlasConfigLoader();

    const config = loader.load(directory) as AtlasConfig & {
      experimental?: { enabled: boolean };
      doctor: { futureOption?: string };
    };

    expect(config.experimental).toEqual({ enabled: true });
    expect(config.doctor.futureOption).toBe('enabled');
    expect(config.doctor.profile).toBe('generation-default');
  });
});
