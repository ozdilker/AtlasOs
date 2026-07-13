import { describe, expect, it, vi } from 'vitest';
import { DiagnosticSeverity } from '../../src/diagnostics/diagnostic-severity.js';
import { DoctorService } from '../../src/intelligence/doctor/doctor-service.js';
import { GenerationInspector } from '../../src/intelligence/inspectors/generation-inspector.js';
import { generationDefaultProfile } from '../../src/intelligence/profiles/generation-default-profile.js';
import { TerminalReporter } from '../../src/intelligence/reporters/terminal-reporter.js';
import { createValidationEngineResult } from '../../src/intelligence/validation/validation-engine-result.js';
import { ValidationEngine } from '../../src/intelligence/validation/validation-engine.js';
import { createGenerationResult } from '../diagnostics/helpers/create-generation-result.js';

function createDoctorService(): DoctorService {
  return new DoctorService(
    new GenerationInspector(() => '2026-07-12T15:00:00.000Z'),
    new ValidationEngine(generationDefaultProfile.rules),
    new TerminalReporter(),
  );
}

describe('DoctorService', () => {
  it('invokes inspector, validation engine, and reporter exactly once', () => {
    const inspector = new GenerationInspector(() => '2026-07-12T15:00:00.000Z');
    const validationEngine = new ValidationEngine(generationDefaultProfile.rules);
    const reporter = new TerminalReporter();
    const inspectSpy = vi.spyOn(inspector, 'inspect');
    const validateSpy = vi.spyOn(validationEngine, 'validate');
    const reportSpy = vi.spyOn(reporter, 'report');
    const doctorService = new DoctorService(inspector, validationEngine, reporter);
    const input = createGenerationResult([
      { relativePath: 'README.md', content: '# MyProject', encoding: 'utf-8' },
    ]);

    doctorService.run(input);

    expect(inspectSpy).toHaveBeenCalledOnce();
    expect(validateSpy).toHaveBeenCalledOnce();
    expect(reportSpy).toHaveBeenCalledOnce();
  });

  it('executes inspector, validation engine, and reporter in order', () => {
    const inspector = new GenerationInspector(() => '2026-07-12T15:00:00.000Z');
    const validationEngine = new ValidationEngine(generationDefaultProfile.rules);
    const reporter = new TerminalReporter();
    const executionOrder: string[] = [];
    vi.spyOn(inspector, 'inspect').mockImplementation((input) => {
      executionOrder.push('inspect');
      return new GenerationInspector(() => '2026-07-12T15:00:00.000Z').inspect(input);
    });
    vi.spyOn(validationEngine, 'validate').mockImplementation((subject) => {
      executionOrder.push('validate');
      return new ValidationEngine(generationDefaultProfile.rules).validate(subject);
    });
    vi.spyOn(reporter, 'report').mockImplementation((validationResult) => {
      executionOrder.push('report');
      return new TerminalReporter().report(validationResult);
    });
    const doctorService = new DoctorService(inspector, validationEngine, reporter);

    doctorService.run(
      createGenerationResult([
        { relativePath: 'README.md', content: '# MyProject', encoding: 'utf-8' },
      ]),
    );

    expect(executionOrder).toEqual(['inspect', 'validate', 'report']);
  });

  it('returns a DoctorResult with report and validationResult', () => {
    const doctorService = createDoctorService();
    const input = createGenerationResult([
      { relativePath: 'README.md', content: '# MyProject', encoding: 'utf-8' },
      {
        relativePath: 'CHANGELOG.md',
        content: '# Changelog',
        encoding: 'utf-8',
      },
      {
        relativePath: 'PROJECT-DASHBOARD.md',
        content: '# Dashboard',
        encoding: 'utf-8',
      },
      {
        relativePath: 'docs/00-governance/README.md',
        content: '# Governance',
        encoding: 'utf-8',
      },
      { relativePath: '.gitignore', content: '', encoding: 'utf-8' },
    ]);

    const result = doctorService.run(input);

    expect(result.report).toContain('Atlas Doctor Report');
    expect(result.report).toContain('Status:\nPASS');
    expect(result.validationResult.hasErrors).toBe(false);
    expect(result.validationResult.rulesExecuted).toBe(5);
    expect(Object.keys(result).sort()).toEqual(['report', 'validationResult'].sort());
  });

  it('passes validation engine output to the reporter', () => {
    const inspector = new GenerationInspector(() => '2026-07-12T15:00:00.000Z');
    const validationEngine = new ValidationEngine(generationDefaultProfile.rules);
    const reporter = new TerminalReporter();
    const validationResult = createValidationEngineResult(
      [
        {
          code: 'README_MISSING',
          severity: DiagnosticSeverity.Error,
          message: 'Project is missing required file "README.md".',
          path: 'README.md',
        },
      ],
      4,
      5,
    );
    vi.spyOn(validationEngine, 'validate').mockReturnValue(validationResult);
    const reportSpy = vi.spyOn(reporter, 'report');
    const doctorService = new DoctorService(inspector, validationEngine, reporter);

    const result = doctorService.run(createGenerationResult([]));

    expect(reportSpy).toHaveBeenCalledWith(validationResult);
    expect(result.validationResult).toBe(validationResult);
    expect(result.report).toContain('Status:\nFAIL');
  });
});
