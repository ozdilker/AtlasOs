import { readFileSync, readdirSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import type { TemplateRegistration } from '../registration/template-registration.js';
import { FilesystemTemplate } from './filesystem-template.js';

const MARKDOWN_EXTENSION = '.md';
const UTF8_ENCODING = 'utf-8';

function isMarkdownFile(filename: string): boolean {
  return extname(filename).toLowerCase() === MARKDOWN_EXTENSION;
}

function createTemplateId(filename: string): string {
  return basename(filename, extname(filename)).toLowerCase();
}

function createTemplateName(filename: string): string {
  return basename(filename, extname(filename));
}

function walkMarkdownFiles(directory: string, entries: string[]): void {
  for (const dirent of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = join(directory, dirent.name);

    if (dirent.isDirectory()) {
      walkMarkdownFiles(absolutePath, entries);
      continue;
    }

    if (dirent.isFile() && isMarkdownFile(dirent.name)) {
      entries.push(absolutePath);
    }
  }
}

function createRegistration(absolutePath: string): TemplateRegistration {
  const filename = basename(absolutePath);
  const id = createTemplateId(filename);
  const content = readFileSync(absolutePath, UTF8_ENCODING);

  return {
    id,
    template: new FilesystemTemplate(id, createTemplateName(filename), content),
    metadata: {
      version: '1.0',
      category: 'external',
      tags: [],
    },
  };
}

export class FilesystemTemplateLoader {
  load(templateDirectory: string): readonly TemplateRegistration[] {
    const resolvedDirectory = resolve(templateDirectory);
    const markdownFiles: string[] = [];

    walkMarkdownFiles(resolvedDirectory, markdownFiles);

    return markdownFiles
      .sort((left, right) => left.localeCompare(right))
      .map((absolutePath) => createRegistration(absolutePath));
  }
}
