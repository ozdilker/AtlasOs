import type { Command } from 'commander';
import { createDoctorService } from '../../intelligence/doctor/create-doctor-service.js';
import type { DoctorService } from '../../intelligence/doctor/doctor-service.js';
import { NotImplementedError } from '../../intelligence/errors/not-implemented-error.js';
import { ReporterFormat } from '../../intelligence/reporters/reporter-format.js';
import {
  type ReporterRegistry,
  createDefaultReporterRegistry,
} from '../../intelligence/reporters/reporter-registry.js';
import type { Reporter } from '../../intelligence/reporters/reporter.js';

export function registerDoctorCommand(
  program: Command,
  createService: (reporter: Reporter) => DoctorService = createDoctorService,
  createReporterRegistry: () => ReporterRegistry = createDefaultReporterRegistry,
  writeStdout: (output: string) => boolean = (output) => process.stdout.write(output),
  writeStderr: (output: string) => boolean = (output) => process.stderr.write(output),
): void {
  program
    .command('doctor')
    .description('Diagnose an Atlas project')
    .argument('[path]', 'Path to the Atlas project', '.')
    .option('--format <format>', 'Output format', ReporterFormat.Terminal)
    .action((path: string, options: { format: string }) => {
      const registry = createReporterRegistry();
      const reporter = registry.get(options.format);

      if (reporter === undefined) {
        writeStderr(`Unknown reporter format: ${options.format}\n`);
        process.exitCode = 1;
        return;
      }

      try {
        const service = createService(reporter);
        const result = service.run(path);

        writeStdout(result.report);
        process.exitCode = result.validationResult.hasErrors ? 1 : 0;
      } catch (error) {
        const message =
          error instanceof NotImplementedError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Failed to diagnose Atlas project.';

        writeStderr(`Error: ${message}\n`);
        process.exitCode = 1;
      }
    });
}
