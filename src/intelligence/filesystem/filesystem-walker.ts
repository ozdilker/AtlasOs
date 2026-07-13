import { readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import type { FilesystemEntry } from './filesystem-entry.js';

const IGNORED_DIRECTORIES = new Set(['.git', 'node_modules', 'dist']);

function toPosixRelativePath(rootDirectory: string, absolutePath: string): string {
  return relative(rootDirectory, absolutePath).split('\\').join('/');
}

export class FilesystemWalker {
  constructor(private readonly rootDirectory: string) {}

  walk(): readonly FilesystemEntry[] {
    const rootDirectory = resolve(this.rootDirectory);
    const entries: FilesystemEntry[] = [];

    this.walkDirectory(rootDirectory, rootDirectory, entries);

    return entries.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  }

  private walkDirectory(
    rootDirectory: string,
    currentDirectory: string,
    entries: FilesystemEntry[],
  ): void {
    for (const dirent of readdirSync(currentDirectory, { withFileTypes: true })) {
      const absolutePath = join(currentDirectory, dirent.name);

      if (dirent.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(dirent.name)) {
          this.walkDirectory(rootDirectory, absolutePath, entries);
        }

        continue;
      }

      if (dirent.isFile()) {
        entries.push({
          relativePath: toPosixRelativePath(rootDirectory, absolutePath),
          absolutePath,
        });
      }
    }
  }
}
