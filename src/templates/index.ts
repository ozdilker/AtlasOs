export {
  README_TEMPLATE_ID,
  ReadmeTemplate,
  TemplateCatalog,
} from './catalog/index.js';
export {
  PROJECT_TEMPLATE_VARIABLE,
  ProjectTemplateContext,
} from './context/index.js';
export type { TemplateContext } from './context/index.js';
export {
  DefaultTemplateEngine,
  InvalidStringTemplateError,
  StringTemplateRenderer,
  TemplateEngine,
  TemplateNotFoundError,
  TemplateRenderer,
} from './engine/index.js';
export {
  MissingTemplateVariableError,
  TemplateInterpolator,
} from './interpolation/index.js';
export {
  DuplicateTemplateError,
  InMemoryTemplateRegistry,
  TemplateRegistry,
} from './registry/index.js';
export type {
  RegistrationMetadata,
  TemplateRegistration,
} from './registration/index.js';
export type { StringTemplate, Template, TemplateMetadata } from './types/index.js';
export { isStringTemplate } from './types/index.js';
