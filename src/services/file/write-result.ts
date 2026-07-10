export type WriteResult = {
  readonly createdFiles: readonly string[];
  readonly skippedFiles: readonly string[];
  readonly createdDirectories: readonly string[];
  readonly errors: readonly string[];
};
