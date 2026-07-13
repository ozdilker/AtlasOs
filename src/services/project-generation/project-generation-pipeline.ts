import { EMPTY_VALIDATION_RESULT } from '../../diagnostics/validation-result.js';
import type { GenerationInspector } from '../../intelligence/inspectors/generation-inspector.js';
import { mapValidationEngineResultToValidationResult } from '../../intelligence/validation/map-to-validation-result.js';
import type { ValidationEngine } from '../../intelligence/validation/validation-engine.js';
import type { TemplateContext } from '../../templates/context/template-context.js';
import type { TemplateEngine } from '../../templates/engine/template-engine.js';
import { PROJECT_DIRECTORY_PATHS } from '../init-project.js';
import type { ProjectScaffoldService } from '../project-scaffold-service.js';
import type { GeneratedFile } from './generated-file.js';
import type { GenerationPlan, PlannedFile } from './generation-plan.js';
import type { GenerationResult } from './generation-result.js';
import { PROJECT_EMPTY_FILES, TEMPLATED_PROJECT_FILES } from './project-generated-files.js';

const DEFAULT_ENCODING = 'utf-8';

const PLANNED_FILES: readonly PlannedFile[] = [
  ...TEMPLATED_PROJECT_FILES.map(
    (file): PlannedFile => ({
      relativePath: file.relativePath,
      encoding: DEFAULT_ENCODING,
      renderStrategy: 'template',
      templateId: file.templateId,
    }),
  ),
  ...PROJECT_EMPTY_FILES.map(
    (relativePath): PlannedFile => ({
      relativePath,
      encoding: DEFAULT_ENCODING,
      renderStrategy: 'empty',
    }),
  ),
];

export class ProjectGenerationPipeline {
  constructor(
    private readonly scaffoldService: ProjectScaffoldService,
    private readonly generationInspector: GenerationInspector,
    private readonly validationEngine: ValidationEngine,
  ) {}

  generate(projectName: string): GenerationResult {
    const plan = this.createPlan(projectName);
    const prepared = this.scaffoldService.prepare(projectName);
    const generatedFiles = this.buildGeneratedFiles(prepared.engine, prepared.context);

    const generationResult: GenerationResult = {
      projectName,
      plan,
      generatedFiles,
      directories: [...PROJECT_DIRECTORY_PATHS],
      warnings: [],
      errors: [],
      validation: EMPTY_VALIDATION_RESULT,
    };

    const inspectionSubject = this.generationInspector.inspect(generationResult);
    const validationEngineResult = this.validationEngine.validate(inspectionSubject);
    const validation = mapValidationEngineResultToValidationResult(validationEngineResult);

    return {
      ...generationResult,
      validation,
    };
  }

  private createPlan(projectName: string): GenerationPlan {
    return {
      projectName,
      directories: [...PROJECT_DIRECTORY_PATHS],
      plannedFiles: PLANNED_FILES,
    };
  }

  private buildGeneratedFiles(engine: TemplateEngine, context: TemplateContext): GeneratedFile[] {
    const templatedFiles = TEMPLATED_PROJECT_FILES.map((file) => ({
      relativePath: file.relativePath,
      content: engine.render(file.templateId, context),
      encoding: DEFAULT_ENCODING,
    }));

    const emptyFiles = PROJECT_EMPTY_FILES.map((relativePath) => ({
      relativePath,
      content: '',
      encoding: DEFAULT_ENCODING,
    }));

    return [...templatedFiles, ...emptyFiles].sort((left, right) =>
      left.relativePath.localeCompare(right.relativePath),
    );
  }
}
