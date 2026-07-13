import { FilesystemInspector } from '../inspectors/filesystem-inspector.js';
import { generationDefaultProfile } from '../profiles/generation-default-profile.js';
import { TerminalReporter } from '../reporters/terminal-reporter.js';
import { ValidationEngine } from '../validation/validation-engine.js';
import { DoctorService } from './doctor-service.js';

export function createDoctorService(): DoctorService {
  return new DoctorService(
    new FilesystemInspector(),
    new ValidationEngine(generationDefaultProfile.rules),
    new TerminalReporter(),
  );
}
