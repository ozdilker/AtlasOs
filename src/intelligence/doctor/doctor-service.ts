import type { Inspector } from '../inspectors/inspector.js';
import type { Reporter } from '../reporters/reporter.js';
import type { ValidationEngine } from '../validation/validation-engine.js';
import { type DoctorResult, createDoctorResult } from './doctor-result.js';

export class DoctorService {
  constructor(
    private readonly inspector: Inspector,
    private readonly validationEngine: ValidationEngine,
    private readonly reporter: Reporter,
  ) {}

  run(input: unknown): DoctorResult {
    const subject = this.inspector.inspect(input);
    const validationResult = this.validationEngine.validate(subject);
    const report = this.reporter.report(validationResult);

    return createDoctorResult(report, validationResult);
  }
}
