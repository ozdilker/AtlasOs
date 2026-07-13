import type { ValidationEngineResult } from '../validation/validation-engine-result.js';

export type DoctorResult = {
  readonly report: string;
  readonly validationResult: ValidationEngineResult;
};

export function createDoctorResult(
  report: string,
  validationResult: ValidationEngineResult,
): DoctorResult {
  return {
    report,
    validationResult,
  };
}
