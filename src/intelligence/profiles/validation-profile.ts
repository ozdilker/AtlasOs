import type { ValidationRule } from '../validation/validation-engine.js';

export type ValidationProfile = {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly rules: readonly ValidationRule[];
};
