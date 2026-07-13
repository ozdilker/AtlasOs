import { NotImplementedError } from '../errors/not-implemented-error.js';
import type { InspectionSubject } from '../models/inspection-subject.js';
import { Inspector } from './inspector.js';

const FILESYSTEM_INSPECTOR_MESSAGE =
  'FilesystemInspector is not yet implemented. atlas doctor requires on-disk project inspection (SPEC-001 MS-07).';

export class FilesystemInspector extends Inspector {
  inspect(_input: unknown): InspectionSubject {
    throw new NotImplementedError(FILESYSTEM_INSPECTOR_MESSAGE);
  }
}
