import { basename, resolve } from 'node:path';
import type { FilesystemReader } from '../filesystem/filesystem-reader.js';
import type { FilesystemWalker } from '../filesystem/filesystem-walker.js';
import type { InspectionFile } from '../models/inspection-file.js';
import { InspectionOrigin } from '../models/inspection-origin.js';
import type { InspectionSubject } from '../models/inspection-subject.js';
import { Inspector } from './inspector.js';

const UTF8_ENCODING = 'utf-8';
const textEncoder = new TextEncoder();

function mapFilesystemEntry(
  entry: { relativePath: string; absolutePath: string },
  content: string,
): InspectionFile {
  return {
    relativePath: entry.relativePath,
    content,
    encoding: UTF8_ENCODING,
    size: textEncoder.encode(content).byteLength,
  };
}

export class FilesystemInspector extends Inspector {
  constructor(
    private readonly filesystemWalker: FilesystemWalker,
    private readonly filesystemReader: FilesystemReader,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {
    super();
  }

  inspect(input: unknown): InspectionSubject {
    const rootDirectory = resolve(String(input));
    const projectName = basename(rootDirectory);
    const generatedAt = this.now();
    const entries = this.filesystemWalker.walk();

    const files = entries.map((entry) =>
      mapFilesystemEntry(entry, this.filesystemReader.read(entry.absolutePath)),
    );

    return {
      id: `filesystem:${projectName}`,
      origin: InspectionOrigin.Filesystem,
      projectName,
      generatedAt,
      files,
      metadata: {},
    };
  }
}
