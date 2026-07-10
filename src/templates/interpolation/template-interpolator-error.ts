export class MissingTemplateVariableError extends Error {
  constructor(variableName: string) {
    super(`Template variable "${variableName}" could not be resolved.`);
    this.name = 'MissingTemplateVariableError';
  }
}
