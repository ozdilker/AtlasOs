# Changelog

All notable changes to Atlas CLI are documented in this file.

The format is milestone-based. Versions follow [Semantic Versioning](https://semver.org/).

---

## Unreleased

### Sprint-010 — Release Readiness (MS-06)

- Added end-to-end tests for the full `atlas init` flow (CLI → pipeline → validation → FileService → filesystem)
- Added CLI subprocess smoke tests
- Introduced GitHub Actions CI workflow (typecheck, lint, test)
- Added `RELEASE_CHECKLIST.md` for milestone release gating
- Repository hygiene: canonical file path exports from `project-generated-files.ts`, removed duplicate pipeline re-export
- Updated README quick-start and project structure documentation

### Sprint-009 — Diagnostics Framework

- Introduced `src/diagnostics/` with `Diagnostic`, `ValidationRule`, `ProjectValidator`, and `ValidationResult`
- Added `ReadmeExistsRule` and `GovernanceReadmeExistsRule`
- Integrated post-generation validation into `ProjectGenerationPipeline`
- Attached `validation` to `GenerationResult`

### Sprint-008 — Governance Templates

- Added `ChangelogTemplate`, `ProjectDashboardTemplate`, and `GovernanceIndexTemplate`
- Extended `TemplateCatalog` to register four default templates
- Updated `ProjectGenerationPipeline` to render all governance documents
- Introduced `project-generated-files.ts` as the canonical file path registry
- `atlas init` now generates `CHANGELOG.md`, `PROJECT-DASHBOARD.md`, and `docs/00-governance/README.md` from templates

### Sprint-007 — Init Migration

- Migrated `atlas init` to `InitProjectService` orchestration
- Removed legacy `initProject()` filesystem orchestration
- Removed `generate-readme.ts` in favor of Template Engine rendering
- Preserved existing CLI UX: success summary, validation, error handling

### Sprint-006 — FileService

- Implemented `FileService` and `FilesystemWriter`
- Added `WriteOptions` and `WriteResult` types
- Introduced overwrite policy (`overwrite: false` default)
- Filesystem persistence separated from rendering per ADR-001

### Sprint-005 — Project Generation Pipeline

- Implemented `ProjectGenerationPipeline` with `GenerationPlan` and `GenerationResult`
- Added `GeneratedFile` type for in-memory file representation
- Pipeline produces content without filesystem side effects

### Sprint-004 — Template Rendering Pipeline

- Implemented `TemplateInterpolator` with `{{projectName}}` support
- Updated `StringTemplateRenderer` to delegate to interpolator
- Implemented `DefaultTemplateEngine` with registry lookup
- Added `ProjectScaffoldService.renderReadme()`
- Introduced `MissingTemplateVariableError`

### Sprint-003 — Registration Pipeline

- Introduced `TemplateRegistration` and `RegistrationMetadata` models
- Updated `InMemoryTemplateRegistry` to store registrations
- Implemented `TemplateCatalog` with `ReadmeTemplate`
- Added `ProjectTemplateContext`
- Implemented `ProjectScaffoldService` for dependency composition

### Sprint-002 — Template Engine Foundation

- Created Template Engine abstractions: `TemplateEngine`, `TemplateRenderer`, `TemplateRegistry`, `TemplateContext`
- Implemented `InMemoryTemplateRegistry` with duplicate-ID rejection
- Implemented `StringTemplateRenderer` and `DefaultTemplateEngine`
- Added `StringTemplate` type and `TemplateRegistration` contracts

---

## v0.1.0-alpha

**Milestone:** MS-01 Bootstrap (Sprint-001)

- Initial Atlas CLI repository bootstrap
- Node.js 22, TypeScript 5, pnpm, Commander.js, Biome, Vitest toolchain
- `atlas init <project-name>` command with PascalCase validation
- Atlas OS directory scaffold (`docs/00-governance` through `docs/11-releases`, `.atlas/`)
- Root file generation: `README.md`, `CHANGELOG.md`, `.gitignore`
- Engineering standards: ESM, strict TypeScript, constructor injection patterns
