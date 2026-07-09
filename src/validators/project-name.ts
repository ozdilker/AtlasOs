const PROJECT_NAME_PATTERN = /^[A-Z][a-zA-Z0-9]*$/;

const WINDOWS_RESERVED_NAMES = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  'COM1',
  'COM2',
  'COM3',
  'COM4',
  'COM5',
  'COM6',
  'COM7',
  'COM8',
  'COM9',
  'LPT1',
  'LPT2',
  'LPT3',
  'LPT4',
  'LPT5',
  'LPT6',
  'LPT7',
  'LPT8',
  'LPT9',
]);

export function validateProjectName(projectName: string): string | null {
  if (projectName.length === 0) {
    return 'Project name is required.';
  }

  if (!PROJECT_NAME_PATTERN.test(projectName)) {
    return 'Project name must start with an uppercase letter and contain only letters and numbers (e.g. MyProject).';
  }

  if (WINDOWS_RESERVED_NAMES.has(projectName.toUpperCase())) {
    return `Project name "${projectName}" is reserved by the operating system.`;
  }

  return null;
}
