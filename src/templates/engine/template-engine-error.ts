export class TemplateNotFoundError extends Error {
  constructor(templateId: string) {
    super(`Template with id "${templateId}" was not found.`);
    this.name = 'TemplateNotFoundError';
  }
}
