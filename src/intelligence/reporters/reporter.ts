import type { ValidationEngineResult } from '../validation/validation-engine-result.js';

export abstract class Reporter {
  abstract report(result: ValidationEngineResult): string;
}
