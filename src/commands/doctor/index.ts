import { resolve } from 'node:path';
import type { Command } from 'commander';
import { AtlasConfigLoader } from '../../config/atlas-config-loader.js';
import { createDoctorService } from '../../intelligence/doctor/create-doctor-service.js';
import type { DoctorService } from '../../intelligence/doctor/doctor-service.js';
import { NotImplementedError } from '../../intelligence/errors/not-implemented-error.js';
import {
  type ReporterRegistry,
  createDefaultReporterRegistry,
} from '../../intelligence/reporters/reporter-registry.js';
import type { Reporter } from '../../intelligence/reporters/reporter.js';

function resolveDoctorFormat(cliFormat: string | undefined, configFormat: string): string {
  return cliFormat ?? configFormat;
}

export function registerDoctorCommand(
  program: Command,
  createService: (reporter: Reporter) => DoctorService = createDoctorService,
  createReporterRegistry: () => ReporterRegistry = createDefaultReporterRegistry,
  createConfigLoader: () => AtlasConfigLoader = () => new AtlasConfigLoader(),
  writeStdout: (output: string) => boolean = (output) => process.stdout.write(output),
  writeStderr: (output: string) => boolean = (output) => process.stderr.write(output),
): void {
  program
    .command('doctor')
    .description('Diagnose an Atlas project')
    .argument('[path]', 'Path to the Atlas project', '.')
    .option('--format <format>', 'Output format')
    .action((path: string, options: { format?: string }) => {
      const projectRoot = resolve(path);
      const config = createConfigLoader().load(projectRoot);
      const format = resolveDoctorFormat(options.format, config.doctor.format);
      const registry = createReporterRegistry();
      const reporter = registry.get(format);

      if (reporter === undefined) {
        writeStderr(`Unknown reporter format: ${format}\n`);
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
