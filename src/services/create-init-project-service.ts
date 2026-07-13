import { createDefaultProjectValidator } from '../diagnostics/create-default-project-validator.js';
import { GenerationInspector } from '../intelligence/inspectors/generation-inspector.js';
import { generationDefaultProfile } from '../intelligence/profiles/generation-default-profile.js';
import { ValidationEngine } from '../intelligence/validation/validation-engine.js';
import { TemplateCatalog } from '../templates/catalog/template-catalog.js';
import { DefaultTemplateEngine } from '../templates/engine/default-template-engine.js';
import { StringTemplateRenderer } from '../templates/engine/string-template-renderer.js';
import { TemplateInterpolator } from '../templates/interpolation/template-interpolator.js';
import { InMemoryTemplateRegistry } from '../templates/registry/in-memory-template-registry.js';
import { FileService } from './file/file-service.js';
import { FilesystemWriter } from './file/filesystem-writer.js';
import { InitProjectService } from './init-project-service.js';
import { ProjectGenerationPipeline } from './project-generation/project-generation-pipeline.js';
import { ProjectScaffoldService } from './project-scaffold-service.js';

export function createInitProjectService(
  baseDirectory: string = process.cwd(),
): InitProjectService {
  const registry = new InMemoryTemplateRegistry();
  const catalog = new TemplateCatalog();
  const interpolator = new TemplateInterpolator();
  const renderer = new StringTemplateRenderer(interpolator);
  const engine = new DefaultTemplateEngine(registry, renderer);
  const scaffoldService = new ProjectScaffoldService(catalog, registry, engine);
  const generationInspector = new GenerationInspector();
  const validationEngine = new ValidationEngine(generationDefaultProfile.rules);
  const pipeline = new ProjectGenerationPipeline(
    scaffoldService,
    generationInspector,
    validationEngine,
  );
  const writer = new FilesystemWriter();
  const fileService = new FileService(writer);

  return new InitProjectService(pipeline, fileService, writer, baseDirectory);
}

export { createDefaultProjectValidator };
