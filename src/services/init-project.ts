import { PROJECT_GENERATED_FILE_PATHS } from './project-generation/project-generated-files.js';

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

export { PROJECT_GENERATED_FILE_PATHS as PROJECT_ROOT_FILES };
