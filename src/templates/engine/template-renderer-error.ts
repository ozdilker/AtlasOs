export class InvalidStringTemplateError extends Error {
  constructor(templateId: string) {
    super(`Template with id "${templateId}" does not contain string content.`);
    this.name = 'InvalidStringTemplateError';
  }
}
