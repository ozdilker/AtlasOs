import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AtlasConfig } from '../../config/atlas-config.js';

export type TemplateDirectoryResolution = {
  readonly exists: boolean;
  readonly directory: string;
};

export function resolveTemplateDirectory(
  projectRoot: string,
  config: AtlasConfig,
): TemplateDirectoryResolution {
  const directory = resolve(projectRoot, config.templates.directory);
  const exists = existsSync(directory) && statSync(directory).isDirectory();

  return {
    exists,
    directory,
  };
}
