export type WriteOptions = {
  readonly overwrite: boolean;
  readonly encoding: BufferEncoding;
  readonly createDirectories: boolean;
};

export const DEFAULT_WRITE_OPTIONS: WriteOptions = {
  overwrite: false,
  encoding: 'utf-8',
  createDirectories: true,
};
