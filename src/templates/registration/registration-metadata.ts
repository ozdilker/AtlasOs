export interface RegistrationMetadata {
  readonly version: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly description?: string;
}
