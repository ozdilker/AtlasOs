import { access, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateReadme } from './generate-readme.js';

const DOC_SECTIONS = [
  '00-governance',
  '01-kernel',
  '02-framework',
  '03-architecture',
  '04-engineering',
  '05-design',
  '06-products',
  '07-playbooks',
  '08-templates',
  '09-adr',
  '10-roadmap',
  '11-releases',
] as const;

export const PROJECT_DIRECTORY_PATHS = [
  ...DOC_SECTIONS.map((section) => `docs/${section}`),
  '.atlas',
] as const;

export const PROJECT_EMPTY_ROOT_FILES = ['CHANGELOG.md', '.gitignore'] as const;

export const PROJECT_ROOT_FILES = ['README.md', ...PROJECT_EMPTY_ROOT_FILES] as const;

export type InitProjectResult = {
  projectName: string;
  directories: readonly string[];
  filesCreated: readonly string[];
  filesSkipped: readonly string[];
};

export class InitProjectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InitProjectError';
  }
}

export async function initProject(
  projectName: string,
  baseDirectory: string = process.cwd(),
): Promise<InitProjectResult> {
  const projectRoot = join(baseDirectory, projectName);

  if (await pathExists(projectRoot)) {
    throw new InitProjectError(`Project directory "${projectName}" already exists.`);
  }

  for (const relativePath of PROJECT_DIRECTORY_PATHS) {
    await mkdir(join(projectRoot, relativePath), { recursive: true });
  }

  const emptyFiles = await createEmptyRootFilesIfMissing(projectRoot);
  const readmeFile = await writeProjectReadmeIfMissing(projectRoot, projectName);

  const created = [
    ...(readmeFile === 'created' ? (['README.md'] as const) : []),
    ...emptyFiles.created,
  ];
  const skipped = [
    ...(readmeFile === 'skipped' ? (['README.md'] as const) : []),
    ...emptyFiles.skipped,
  ];

  return {
    projectName,
    directories: PROJECT_DIRECTORY_PATHS,
    filesCreated: created,
    filesSkipped: skipped,
  };
}

export async function createEmptyRootFilesIfMissing(projectRoot: string): Promise<{
  created: string[];
  skipped: string[];
}> {
  const created: string[] = [];
  const skipped: string[] = [];

  for (const fileName of PROJECT_EMPTY_ROOT_FILES) {
    const filePath = join(projectRoot, fileName);

    try {
      await writeFile(filePath, '', { flag: 'wx' });
      created.push(fileName);
    } catch (error) {
      if (isNodeError(error) && error.code === 'EEXIST') {
        skipped.push(fileName);
        continue;
      }

      throw error;
    }
  }

  return { created, skipped };
}

export async function writeProjectReadmeIfMissing(
  projectRoot: string,
  projectName: string,
): Promise<'created' | 'skipped'> {
  const filePath = join(projectRoot, 'README.md');

  try {
    await writeFile(filePath, generateReadme(projectName), { flag: 'wx' });
    return 'created';
  } catch (error) {
    if (isNodeError(error) && error.code === 'EEXIST') {
      return 'skipped';
    }

    throw error;
  }
}

async function pathExists(targetPath: string): Promise<boolean> {
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

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
