import type { StringTemplate } from '../types/string-template.js';
import type { TemplateMetadata } from '../types/template.js';

export class FilesystemTemplate implements StringTemplate {
  readonly metadata: TemplateMetadata;
  readonly content: string;

  constructor(id: string, name: string, content: string) {
    this.metadata = {
      id,
      name,
    };
    this.content = content;
  }
}
