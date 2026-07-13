import { readFileSync } from 'node:fs';

const UTF8_ENCODING = 'utf-8';

export class FilesystemReader {
  read(path: string): string {
    return readFileSync(path, UTF8_ENCODING);
  }
}
