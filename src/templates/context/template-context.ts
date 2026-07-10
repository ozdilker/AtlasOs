export interface TemplateContext {
  getVariable(key: string): unknown;
  hasVariable(key: string): boolean;
}
