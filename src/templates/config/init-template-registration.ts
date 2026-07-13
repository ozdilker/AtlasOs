import { AtlasConfigLoader } from '../../config/atlas-config-loader.js';
import { TemplateCatalog } from '../catalog/template-catalog.js';
import { FilesystemTemplateLoader } from '../filesystem/filesystem-template-loader.js';
import type { TemplateRegistration } from '../registration/template-registration.js';
import type { TemplateRegistry } from '../registry/template-registry.js';
import { resolveTemplateDirectory } from './template-directory-resolver.js';

export type RegisterInitTemplatesDependencies = {
  readonly configLoader?: AtlasConfigLoader;
  readonly filesystemTemplateLoader?: FilesystemTemplateLoader;
  readonly catalog?: TemplateCatalog;
};

function registerBuiltInTemplates(registry: TemplateRegistry, catalog: TemplateCatalog): void {
  catalog.registerDefaults(registry);
}

function registerFilesystemTemplates(
  registry: TemplateRegistry,
  registrations: readonly TemplateRegistration[],
): void {
  for (const registration of registrations) {
    registry.register(registration);
  }
}

export function registerInitTemplates(
  registry: TemplateRegistry,
  projectRoot: string,
  dependencies: RegisterInitTemplatesDependencies = {},
): void {
  const configLoader = dependencies.configLoader ?? new AtlasConfigLoader();
  const catalog = dependencies.catalog ?? new TemplateCatalog();
  const filesystemTemplateLoader =
    dependencies.filesystemTemplateLoader ?? new FilesystemTemplateLoader();
  const config = configLoader.load(projectRoot);
  const resolution = resolveTemplateDirectory(projectRoot, config);

  if (!resolution.exists) {
    registerBuiltInTemplates(registry, catalog);
    return;
  }

  try {
    const registrations = filesystemTemplateLoader.load(resolution.directory);
    registerFilesystemTemplates(registry, registrations);
  } catch {
    registerBuiltInTemplates(registry, catalog);
  }
}
