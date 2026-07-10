export class DuplicateTemplateError extends Error {
  constructor(templateId: string) {
    super(`Template with id "${templateId}" is already registered.`);
    this.name = 'DuplicateTemplateError';
  }
}
