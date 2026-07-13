import { FilesystemReader } from '../filesystem/filesystem-reader.js';
import { FilesystemWalker } from '../filesystem/filesystem-walker.js';
import { FilesystemInspector } from '../inspectors/filesystem-inspector.js';
import { Inspector } from '../inspectors/inspector.js';
import { generationDefaultProfile } from '../profiles/generation-default-profile.js';
import type { Reporter } from '../reporters/reporter.js';
import { ValidationEngine } from '../validation/validation-engine.js';
import { DoctorService } from './doctor-service.js';

class PathAwareFilesystemInspector extends Inspector {
  constructor(private readonly filesystemReader: FilesystemReader) {
    super();
  }

  inspect(input: unknown) {
    const rootDirectory = String(input);

    return new FilesystemInspector(
      new FilesystemWalker(rootDirectory),
      this.filesystemReader,
    ).inspect(rootDirectory);
  }
}

export function createDoctorService(reporter: Reporter): DoctorService {
  return new DoctorService(
    new PathAwareFilesystemInspector(new FilesystemReader()),
    new ValidationEngine(generationDefaultProfile.rules),
    reporter,
  );
}
