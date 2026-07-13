import type { Command } from 'commander';
import { createInitProjectService } from '../../services/create-init-project-service.js';
import { InitProjectError } from '../../services/init-project-error.js';
import type { InitProjectService } from '../../services/init-project-service.js';
import { validateProjectName } from '../../validators/project-name.js';
import { formatInitValidationSummary } from './format-init-validation-summary.js';

export function registerInitCommand(
  program: Command,
  createService: (baseDirectory?: string) => InitProjectService = createInitProjectService,
): void {
  program
    .command('init')
    .description('Initialize a new Atlas project')
    .argument('<project-name>', 'Name of the Atlas project to create')
    .action(async (projectName: string) => {
      const validationError = validateProjectName(projectName);

      if (validationError !== null) {
        console.error(`Error: ${validationError}`);
        process.exitCode = 1;
        return;
      }

      try {
        const service = createService();
        const result = await service.execute(projectName);

        console.log(`Successfully initialized Atlas project: ${projectName}`);
        console.log('');
        console.log(`Directories created: ${result.directories.length}`);
        for (const directory of result.directories) {
          console.log(`  ${directory}/`);
        }

        if (result.filesCreated.length > 0) {
          console.log('');
          console.log(`Files created: ${result.filesCreated.length}`);
          for (const file of result.filesCreated) {
            console.log(`  ${file}`);
          }
        }

        if (result.filesSkipped.length > 0) {
          console.log('');
          console.log(`Files skipped (already exist): ${result.filesSkipped.length}`);
          for (const file of result.filesSkipped) {
            console.log(`  ${file}`);
          }
        }

        console.log('');
        console.log(formatInitValidationSummary(result.validation));
      } catch (error) {
        const message =
          error instanceof InitProjectError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Failed to initialize Atlas project.';

        console.error(`Error: ${message}`);
        process.exitCode = 1;
      }
    });
}
