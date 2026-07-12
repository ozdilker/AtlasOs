import { describe, expect, it } from 'vitest';
import { DiagnosticSeverity } from '../../src/diagnostics/diagnostic-severity.js';
import { createValidationResult } from '../../src/diagnostics/validation-result.js';
import { GenerationInspector } from '../../src/intelligence/inspectors/generation-inspector.js';
import { InspectionOrigin } from '../../src/intelligence/models/inspection-origin.js';
import type { InspectionSubject } from '../../src/intelligence/models/inspection-subject.js';
import { version } from '../../src/version.js';
import { createGenerationResult } from '../diagnostics/helpers/create-generation-result.js';

const FIXED_TIMESTAMP = '2026-07-12T15:00:00.000Z';

function createInspector(now: () => string = () => FIXED_TIMESTAMP): GenerationInspector {
  return new GenerationInspector(now);
}

describe('GenerationInspector', () => {
  it('maps generation results to inspection subjects with generation origin', () => {
    const result = createGenerationResult([
      { relativePath: 'README.md', content: '# MyProject\n', encoding: 'utf-8' },
    ]);
    const inspector = createInspector();

    const subject = inspector.inspect(result);

    expect(subject.origin).toBe(InspectionOrigin.Generation);
    expect(subject.id).toBe('generation:MyProject');
  });

  it('maps project name from the generation plan', () => {
    const result = createGenerationResult([], {
      projectName: 'RootName',
      plan: {
        projectName: 'PlanName',
        directories: [],
        plannedFiles: [],
      },
    });
    const inspector = createInspector();

    const subject = inspector.inspect(result);

    expect(subject.projectName).toBe('PlanName');
  });

  it('maps all generated files without filtering', () => {
    const result = createGenerationResult([
      { relativePath: 'README.md', content: '# MyProject\n', encoding: 'utf-8' },
      { relativePath: 'CHANGELOG.md', content: '# Changelog\n', encoding: 'utf-8' },
      { relativePath: '.gitignore', content: '', encoding: 'utf-8' },
    ]);
    const inspector = createInspector();

    const subject = inspector.inspect(result);

    expect(subject.files).toHaveLength(3);
    expect(subject.files.map((file) => file.relativePath)).toEqual([
      'README.md',
      'CHANGELOG.md',
      '.gitignore',
    ]);
    expect(subject.files[0]).toEqual({
      relativePath: 'README.md',
      content: '# MyProject\n',
      encoding: 'utf-8',
      size: 12,
    });
    expect(subject.files[2]?.size).toBe(0);
    expect(subject.generatedAt).toBe(FIXED_TIMESTAMP);
  });

  it('preserves generation metadata and validation state', () => {
    const passed = createGenerationResult([
      { relativePath: 'README.md', content: '# MyProject\n', encoding: 'utf-8' },
    ]);
    const warned = createGenerationResult([], {
      validation: createValidationResult([
        {
          code: 'SAMPLE_WARNING',
          severity: DiagnosticSeverity.Warning,
          message: 'Sample warning.',
        },
      ]),
    });
    const failed = createGenerationResult([], {
      validation: createValidationResult([
        {
          code: 'SAMPLE_ERROR',
          severity: DiagnosticSeverity.Error,
          message: 'Sample error.',
        },
      ]),
    });
    const inspector = createInspector();

    expect(inspector.inspect(passed).metadata).toEqual({
      generationVersion: version,
      validationState: 'passed',
    });
    expect(inspector.inspect(warned).metadata).toEqual({
      generationVersion: version,
      validationState: 'warnings',
    });
    expect(inspector.inspect(failed).metadata).toEqual({
      generationVersion: version,
      validationState: 'failed',
    });
  });

  it('returns an immutable inspection subject snapshot', () => {
    const result = createGenerationResult([
      { relativePath: 'README.md', content: 'original', encoding: 'utf-8' },
    ]);
    const inspector = createInspector();

    const subject: InspectionSubject = inspector.inspect(result);
    const sourceFile = result.generatedFiles[0];

    if (sourceFile === undefined) {
      throw new Error('Expected a generated file in the test fixture.');
    }

    sourceFile.content = 'mutated';

    expect(subject.files[0]?.content).toBe('original');
    expect(subject.files).not.toBe(result.generatedFiles);
    expect([...subject.files]).toEqual([
      {
        relativePath: 'README.md',
        content: 'original',
        encoding: 'utf-8',
        size: 8,
      },
    ]);
  });
});
