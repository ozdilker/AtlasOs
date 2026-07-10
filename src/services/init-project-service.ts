import { join } from 'node:path';
import type { FileService } from './file/file-service.js';
import type { FilesystemWriter } from './file/filesystem-writer.js';
import { InitProjectError } from './init-project-error.js';
import type { ProjectGenerationPipeline } from './project-generation/project-generation-pipeline.js';

export type InitProjectExecutionResult = {
  readonly projectName: string;
  readonly directories: readonly string[];
  readonly filesCreated: readonly string[];
  readonly filesSkipped: readonly string[];
};

export class InitProjectService {
  constructor(
    private readonly pipeline: ProjectGenerationPipeline,
    private readonly fileService: FileService,
    private readonly writer: FilesystemWriter,
    private readonly baseDirectory: string = process.cwd(),
  ) {}

  async execute(projectName: string): Promise<InitProjectExecutionResult> {
    const projectRoot = join(this.baseDirectory, projectName);

    if (await this.writer.directoryExists(projectRoot)) {
      throw new InitProjectError(`Project directory "${projectName}" already exists.`);
    }

    const generationResult = this.pipeline.generate(projectName);
    const writeResult = await this.fileService.write(this.baseDirectory, generationResult);

    if (writeResult.errors.length > 0) {
      throw new InitProjectError(writeResult.errors.join(' '));
    }

    return {
      projectName,
      directories: generationResult.directories,
      filesCreated: writeResult.createdFiles,
      filesSkipped: writeResult.skippedFiles,
    };
  }
}
