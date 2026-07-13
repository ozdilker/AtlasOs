import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Command } from 'commander';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../src/cli.js';
import { registerDoctorCommand } from '../../src/commands/doctor/index.js';
import { DiagnosticSeverity } from '../../src/diagnostics/diagnostic-severity.js';
import { createDoctorService } from '../../src/intelligence/doctor/create-doctor-service.js';
import type { DoctorResult } from '../../src/intelligence/doctor/doctor-result.js';
import type { DoctorService } from '../../src/intelligence/doctor/doctor-service.js';
import { createValidationEngineResult } from '../../src/intelligence/validation/validation-engine-result.js';

function createDoctorResult(overrides: Partial<DoctorResult> = {}): DoctorResult {
  const validationResult = createValidationEngineResult([], 5, 5);

  return {
    report: 'Atlas Doctor Report\n\nStatus:\nPASS',
    validationResult,
    ...overrides,
  };
}

const tempDirectories: string[] = [];

afterEach(async () => {
  process.exitCode = 0;
  await Promise.all(
    tempDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('doctor command', () => {
  it('registers the doctor command on the CLI program', () => {
    const program = createProgram();

    expect(program.commands.map((command) => command.name())).toContain('doctor');
  });

  it('invokes DoctorService with the provided path', () => {
    const run = vi.fn(() => createDoctorResult());
    const service = { run } as unknown as DoctorService;
    const program = new Command();
    registerDoctorCommand(program, () => service);

    program.parse(['doctor', './my-project'], { from: 'user' });

    expect(run).toHaveBeenCalledOnce();
    expect(run).toHaveBeenCalledWith('./my-project');
  });

  it('defaults the path to the current directory', () => {
    const run = vi.fn(() => createDoctorResult());
    const service = { run } as unknown as DoctorService;
    const program = new Command();
    registerDoctorCommand(program, () => service);

    program.parse(['doctor'], { from: 'user' });

    expect(run).toHaveBeenCalledWith('.');
  });

  it('writes the report to stdout and sets exit code 0 when there are no errors', () => {
    const run = vi.fn(() => createDoctorResult());
    const service = { run } as unknown as DoctorService;
    const writeStdout = vi.fn(() => true);
    const program = new Command();
    registerDoctorCommand(program, () => service, writeStdout);

    program.parse(['doctor'], { from: 'user' });

    expect(writeStdout).toHaveBeenCalledWith('Atlas Doctor Report\n\nStatus:\nPASS');
    expect(process.exitCode).toBe(0);
  });

  it('sets exit code 1 when validation reports errors', () => {
    const run = vi.fn(() =>
      createDoctorResult({
        report: 'Atlas Doctor Report\n\nStatus:\nFAIL',
        validationResult: createValidationEngineResult(
          [
            {
              code: 'README_MISSING',
              severity: DiagnosticSeverity.Error,
              message: 'Project is missing required file "README.md".',
              path: 'README.md',
            },
          ],
          5,
          5,
        ),
      }),
    );
    const service = { run } as unknown as DoctorService;
    const program = new Command();
    registerDoctorCommand(program, () => service);

    program.parse(['doctor'], { from: 'user' });

    expect(process.exitCode).toBe(1);
  });

  it('runs the default doctor service against a valid project directory', async () => {
    const rootDirectory = await mkdtemp(join(tmpdir(), 'atlas-doctor-command-'));
    tempDirectories.push(rootDirectory);
    await writeFile(join(rootDirectory, 'README.md'), '# Project');
    await writeFile(join(rootDirectory, 'CHANGELOG.md'), '# Changelog');
    await writeFile(join(rootDirectory, 'PROJECT-DASHBOARD.md'), '# Dashboard');
    await mkdir(join(rootDirectory, 'docs', '00-governance'), { recursive: true });
    await writeFile(join(rootDirectory, 'docs', '00-governance', 'README.md'), '# Governance');
    await writeFile(join(rootDirectory, '.gitignore'), '');

    const writeStdout = vi.fn(() => true);
    const program = new Command();
    registerDoctorCommand(program, createDoctorService, writeStdout);

    program.parse(['doctor', rootDirectory], { from: 'user' });

    expect(writeStdout).toHaveBeenCalledOnce();
    expect(String(writeStdout.mock.calls[0]?.[0])).toContain('Atlas Doctor Report');
    expect(String(writeStdout.mock.calls[0]?.[0])).toContain('Status:\nPASS');
    expect(process.exitCode).toBe(0);
  });
});
