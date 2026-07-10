export interface TemplateMetadata {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly version?: string;
}

export interface Template {
  readonly metadata: TemplateMetadata;
}
