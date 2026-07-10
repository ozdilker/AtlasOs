import { access, mkdir, writeFile } from 'node:fs/promises';

export type FilesystemWriteFileOptions = {
  readonly encoding: BufferEncoding;
  readonly overwrite: boolean;
};

export class FilesystemWriter {
  async directoryExists(targetPath: string): Promise<boolean> {
    try {
      await access(targetPath);
      return true;
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return false;
      }

      throw error;
    }
  }

  async ensureDirectory(targetPath: string): Promise<boolean> {
    if (await this.directoryExists(targetPath)) {
      return false;
    }

    await mkdir(targetPath, { recursive: true });
    return true;
  }

  async writeFile(
    targetPath: string,
    content: string,
    options: FilesystemWriteFileOptions,
  ): Promise<'created' | 'skipped'> {
    const flag = options.overwrite ? 'w' : 'wx';

    try {
      await writeFile(targetPath, content, { encoding: options.encoding, flag });
      return 'created';
    } catch (error) {
      if (!options.overwrite && isNodeError(error) && error.code === 'EEXIST') {
        return 'skipped';
      }

      throw error;
    }
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
