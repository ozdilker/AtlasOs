import type { GenerationResult } from '../../services/project-generation/generation-result.js';
import { version } from '../../version.js';
import type { InspectionFile } from '../models/inspection-file.js';
import { InspectionOrigin } from '../models/inspection-origin.js';
import type { InspectionSubject } from '../models/inspection-subject.js';
import { Inspector } from './inspector.js';

const textEncoder = new TextEncoder();

function mapGeneratedFile(file: GenerationResult['generatedFiles'][number]): InspectionFile {
  return {
    relativePath: file.relativePath,
    content: file.content,
    encoding: file.encoding,
    size: textEncoder.encode(file.content).byteLength,
  };
}

function resolveValidationState(result: GenerationResult): string {
  if (result.validation.hasErrors) {
    return 'failed';
  }

  if (result.validation.hasWarnings) {
    return 'warnings';
  }

  return 'passed';
}

export class GenerationInspector extends Inspector {
  constructor(
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly generationVersion: string = version,
  ) {
    super();
  }

  inspect(input: unknown): InspectionSubject {
    const result = input as GenerationResult;
    const generatedAt = this.now();

    return {
      id: `generation:${result.plan.projectName}`,
      origin: InspectionOrigin.Generation,
      projectName: result.plan.projectName,
      generatedAt,
      files: result.generatedFiles.map(mapGeneratedFile),
      metadata: {
        generationVersion: this.generationVersion,
        validationState: resolveValidationState(result),
      },
    };
  }
}
