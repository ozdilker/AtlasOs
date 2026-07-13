# Changelog

All notable changes to Atlas CLI are documented in this file.

The format is milestone-based. Versions follow [Semantic Versioning](https://semver.org/).

---

## Unreleased

_No changes yet._

---

## v0.3.0-beta

**Milestone:** MS-07 — Project Intelligence

### Project Intelligence

- Introduced `src/intelligence/` horizontal kernel layer per [ADR-002](docs/09-adr/ADR-002-project-intelligence-architecture.md)
- `GenerationInspector` maps in-memory `GenerationResult` to `InspectionSubject`
- `FilesystemInspector` with `FilesystemWalker` and `FilesystemReader` for on-disk inspection
- `ValidationEngine` with profile-based rule execution
- `generation-default` profile with five existence rules (`readme-exists`, `governance-readme-exists`, `project-dashboard-exists`, `changelog-exists`, `gitignore-exists`)
- Pipeline delegates validation to Project Intelligence; `GenerationResult.validation` retained for compatibility

### Doctor

- `DoctorService` orchestrates inspect → validate → report
- `atlas doctor [path]` CLI command with filesystem-backed validation
- Exit code `1` when validation reports errors; `0` otherwise

### Reporter

- `TerminalReporter` — human-readable diagnostic report
- `JsonReporter` — structured JSON output (`schemaVersion` `1.0`)
- `ReporterRegistry` with `createDefaultReporterRegistry()`
- `atlas doctor --format terminal|json` with config default from `doctor.format`

### Configuration

- `atlas.config.json` support via `AtlasConfigLoader` with deep-merge defaults
- `doctor.format` wired into doctor command format resolution
- `templates.directory` wired into init template resolution

### External Templates

- `resolveTemplateDirectory()` resolves configured template path relative to project root
- `FilesystemTemplateLoader` loads `*.md` files as `TemplateRegistration` entries
- `registerInitTemplates()` integrates external templates into `atlas init` (replace policy; fallback to built-in on missing directory or load failure)

### Init UX

- Post-init validation summary displayed after success output (`formatInitValidationSummary`)
- Validation output is informational only — init does not fail on validation errors

### Documentation

- Synchronized README, ARCHITECTURE, ROADMAP, CHANGELOG, and RELEASE_CHECKLIST for beta readiness
- MS-07 marked complete; MS-08 Developer Experience introduced as planned

---

## v0.2.0-alpha

**Milestone:** MS-06 — Release Readiness

### Sprint-010 — Release Readiness

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

---

## v0.1.0-alpha

**Milestone:** MS-01 through MS-05

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
- Preserved existing CLI UX: success summary, error handling

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

### Sprint-001 — Bootstrap

- Initial Atlas CLI repository bootstrap
- Node.js 22, TypeScript 5, pnpm, Commander.js, Biome, Vitest toolchain
- `atlas init <project-name>` command with PascalCase validation
- Atlas OS directory scaffold (`docs/00-governance` through `docs/11-releases`, `.atlas/`)
- Root file generation: `README.md`, `CHANGELOG.md`, `.gitignore`
- Engineering standards: ESM, strict TypeScript, constructor injection patterns
