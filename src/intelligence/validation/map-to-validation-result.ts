import {
  type ValidationResult,
  createValidationResult,
} from '../../diagnostics/validation-result.js';
import type { ValidationEngineResult } from './validation-engine-result.js';

export function mapValidationEngineResultToValidationResult(
  result: ValidationEngineResult,
): ValidationResult {
  return createValidationResult([...result.diagnostics]);
}
