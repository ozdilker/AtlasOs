import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AtlasConfig } from './atlas-config.js';
import { createDefaultConfig } from './create-default-config.js';

const CONFIG_FILE_NAME = 'atlas.config.json';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const existing = result[key];

    if (isPlainObject(existing) && isPlainObject(value)) {
      result[key] = deepMerge(existing, value);
      continue;
    }

    result[key] = value;
  }

  return result;
}

export class AtlasConfigLoader {
  load(path: string): AtlasConfig {
    const defaults = createDefaultConfig();
    const configPath = join(path, CONFIG_FILE_NAME);

    if (!existsSync(configPath)) {
      return defaults;
    }

    const raw = readFileSync(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    return deepMerge(
      defaults as unknown as Record<string, unknown>,
      parsed,
    ) as unknown as AtlasConfig;
  }
}
