import type { AtlasConfig } from './atlas-config.js';

export function createDefaultConfig(): AtlasConfig {
  return {
    project: {},
    doctor: {
      profile: 'generation-default',
      format: 'terminal',
    },
    templates: {
      directory: './templates',
    },
  };
}
