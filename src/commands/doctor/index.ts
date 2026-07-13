import type { Command } from 'commander';
import { createDoctorService } from '../../intelligence/doctor/create-doctor-service.js';
import type { DoctorService } from '../../intelligence/doctor/doctor-service.js';
import { NotImplementedError } from '../../intelligence/errors/not-implemented-error.js';

export function registerDoctorCommand(
  program: Command,
  createService: () => DoctorService = createDoctorService,
  writeStdout: (output: string) => boolean = (output) => process.stdout.write(output),
): void {
  program
    .command('doctor')
    .description('Diagnose an Atlas project')
    .argument('[path]', 'Path to the Atlas project', '.')
    .action((path: string) => {
      try {
        const service = createService();
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

        console.error(`Error: ${message}`);
        process.exitCode = 1;
      }
    });
}
