import type { Template } from '../types/template.js';

export abstract class TemplateRegistry {
  abstract register(template: Template): void;
  abstract get(id: string): Template | undefined;
  abstract has(id: string): boolean;
  abstract list(): readonly Template[];
}
