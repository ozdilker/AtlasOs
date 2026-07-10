import { join } from 'node:path';
import type { GenerationResult } from '../project-generation/generation-result.js';
import type { FilesystemWriter } from './filesystem-writer.js';
import { DEFAULT_WRITE_OPTIONS, type WriteOptions } from './write-options.js';
import type { WriteResult } from './write-result.js';

export class FileService {
  constructor(private readonly writer: FilesystemWriter) {}

  async write(
    baseDirectory: string,
    generationResult: GenerationResult,
    options: WriteOptions = DEFAULT_WRITE_OPTIONS,
  ): Promise<WriteResult> {
    const projectRoot = join(baseDirectory, generationResult.projectName);
    const createdFiles: string[] = [];
    const skippedFiles: string[] = [];
    const createdDirectories: string[] = [];
    const errors: string[] = [];

    if (options.createDirectories) {
      await this.createDirectories(
        projectRoot,
        generationResult.directories,
        createdDirectories,
        errors,
      );
    }

    await this.writeGeneratedFiles(
      projectRoot,
      generationResult,
      options,
      createdFiles,
      skippedFiles,
      errors,
    );

    return {
      createdFiles,
      skippedFiles,
      createdDirectories,
      errors,
    };
  }

  private async createDirectories(
    projectRoot: string,
    directories: readonly string[],
    createdDirectories: string[],
    errors: string[],
  ): Promise<void> {
    try {
      await this.writer.ensureDirectory(projectRoot);
    } catch (error) {
      errors.push(this.toErrorMessage('directory', projectRoot, error));
    }

    for (const relativeDirectory of directories) {
      const directoryPath = join(projectRoot, relativeDirectory);

      try {
        if (await this.writer.ensureDirectory(directoryPath)) {
          createdDirectories.push(relativeDirectory);
        }
      } catch (error) {
        errors.push(this.toErrorMessage('directory', relativeDirectory, error));
      }
    }
  }

  private async writeGeneratedFiles(
    projectRoot: string,
    generationResult: GenerationResult,
    options: WriteOptions,
    createdFiles: string[],
    skippedFiles: string[],
    errors: string[],
  ): Promise<void> {
    for (const file of generationResult.generatedFiles) {
      const filePath = join(projectRoot, file.relativePath);

      try {
        const outcome = await this.writer.writeFile(filePath, file.content, {
          encoding: (file.encoding as BufferEncoding) || options.encoding,
          overwrite: options.overwrite,
        });

        if (outcome === 'created') {
          createdFiles.push(file.relativePath);
        } else {
          skippedFiles.push(file.relativePath);
        }
      } catch (error) {
        errors.push(this.toErrorMessage('file', file.relativePath, error));
      }
    }
  }

  private toErrorMessage(
    resourceType: 'file' | 'directory',
    target: string,
    error: unknown,
  ): string {
    const message = error instanceof Error ? error.message : 'Unknown filesystem error.';
    return `Failed to write ${resourceType} "${target}": ${message}`;
  }
}
