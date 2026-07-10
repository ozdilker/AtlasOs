import { README_TEMPLATE_ID } from '../../templates/catalog/readme-template.js';
import {
  PROJECT_DIRECTORY_PATHS,
  PROJECT_EMPTY_ROOT_FILES,
  PROJECT_ROOT_FILES,
} from '../init-project.js';
import type { ProjectScaffoldService } from '../project-scaffold-service.js';
import type { GeneratedFile } from './generated-file.js';
import type { GenerationPlan, PlannedFile } from './generation-plan.js';
import type { GenerationResult } from './generation-result.js';

const DEFAULT_ENCODING = 'utf-8';

const PLANNED_FILES: readonly PlannedFile[] = [
  {
    relativePath: 'README.md',
    encoding: DEFAULT_ENCODING,
    renderStrategy: 'template',
    templateId: README_TEMPLATE_ID,
  },
  ...PROJECT_EMPTY_ROOT_FILES.map(
    (relativePath): PlannedFile => ({
      relativePath,
      encoding: DEFAULT_ENCODING,
      renderStrategy: 'empty',
    }),
  ),
];

export class ProjectGenerationPipeline {
  constructor(private readonly scaffoldService: ProjectScaffoldService) {}

  generate(projectName: string): GenerationResult {
    const plan = this.createPlan(projectName);
    const prepared = this.scaffoldService.prepare(projectName);
    const readmeContent = prepared.engine.render(README_TEMPLATE_ID, prepared.context);

    const generatedFiles = this.buildGeneratedFiles(readmeContent);

    return {
      projectName,
      plan,
      generatedFiles,
      directories: [...PROJECT_DIRECTORY_PATHS],
      warnings: [],
      errors: [],
    };
  }

  private createPlan(projectName: string): GenerationPlan {
    return {
      projectName,
      directories: [...PROJECT_DIRECTORY_PATHS],
      plannedFiles: PLANNED_FILES,
    };
  }

  private buildGeneratedFiles(readmeContent: string): GeneratedFile[] {
    return PROJECT_ROOT_FILES.map((relativePath) => ({
      relativePath,
      content: relativePath === 'README.md' ? readmeContent : '',
      encoding: DEFAULT_ENCODING,
    }));
  }
}
