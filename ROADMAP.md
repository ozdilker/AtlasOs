# Atlas CLI Roadmap

Engineering roadmap for the Atlas CLI kernel. This document tracks completed milestones, the active sprint, and planned work toward `v0.2.0-alpha`.

**Current version:** `v0.1.0-alpha`  
**Target milestone:** `v0.2.0-alpha` (MS-06)

---

## Completed Milestones

### MS-01 — Bootstrap

**Sprints:** Sprint-001

Established the Atlas CLI repository, toolchain, and the `atlas init` command scaffold.

- Node.js 22, TypeScript 5, pnpm, Commander.js, Biome, Vitest
- Project directory scaffold (`docs/*`, `.atlas/`)
- Project name validation (PascalCase)
- Initial file generation (`README.md`, `CHANGELOG.md`, `.gitignore`)

---

### MS-02 — Template Engine

**Sprints:** Sprint-002, Sprint-003 (foundation), Sprint-004 (rendering)

Introduced the Template Engine kernel with rendering separated from filesystem I/O per [ADR-001](docs/09-adr/ADR-001-rendering-and-file-writing-separation.md).

- Abstract contracts: `TemplateEngine`, `TemplateRenderer`, `TemplateRegistry`, `TemplateContext`
- `InMemoryTemplateRegistry` with duplicate-ID rejection
- `StringTemplateRenderer` and `DefaultTemplateEngine`
- `TemplateInterpolator` with `{{projectName}}` variable support
- `MissingTemplateVariableError` and domain error types

---

### MS-03 — Registration Pipeline

**Sprints:** Sprint-003

Formalized template registration and catalog bootstrap.

- `TemplateRegistration` and `RegistrationMetadata` models
- `TemplateCatalog` with `registerDefaults()`
- `ReadmeTemplate` as the first `StringTemplate`
- `ProjectTemplateContext` for project-scoped variables
- `ProjectScaffoldService` for dependency composition

---

### MS-04 — Project Generation

**Sprints:** Sprint-005, Sprint-006, Sprint-007

Built the end-to-end project generation and persistence pipeline.

- `ProjectGenerationPipeline` with `GenerationPlan` and `GenerationResult`
- `FileService` and `FilesystemWriter` (ADR-001 compliant)
- Overwrite policy (`overwrite: false` default)
- `InitProjectService` orchestrating pipeline + file service
- `atlas init` migrated off legacy `init-project` orchestration

---

### MS-05 — Governance Templates

**Sprints:** Sprint-008

Extended the template catalog with the first Governance Template Suite.

- `ChangelogTemplate`, `ProjectDashboardTemplate`, `GovernanceIndexTemplate`
- Generation of `CHANGELOG.md`, `PROJECT-DASHBOARD.md`, `docs/00-governance/README.md`
- Centralized file registry (`project-generated-files.ts`)
- Generic pipeline rendering for all templated files

---

### MS-06 — Release Readiness

**Sprints:** Sprint-009, Sprint-010

Diagnostics, validation, and release-quality hardening for `v0.2.0-alpha`.

- Diagnostics & Validation Framework (`ProjectValidator`, `ValidationRule`, `ValidationResult`)
- Post-generation validation integrated into `ProjectGenerationPipeline`
- End-to-end and smoke test coverage for `atlas init`
- GitHub Actions CI (typecheck, lint, test)
- `RELEASE_CHECKLIST.md` for milestone gating

---

## Upcoming Milestones

### v0.2.0-alpha Release

Tag and publish the milestone incorporating MS-06 work.

- Version bump (`package.json`, `src/version.ts`)
- GitHub Release with changelog summary
- Distribution verification (`pnpm build`, packaged `dist/`)

### Diagnostics CLI

Expose diagnostics through a user-facing command.

- `atlas doctor` or equivalent diagnostic entry point
- Disk-aware validation rules beyond generation-time checks
- Structured diagnostic output (table, JSON, exit codes)

### Stabilization

Harden error surfaces and reduce remaining technical debt.

- Consolidate service factory wiring into shared test/production factories
- Expand `TemplateContext` variables
- Performance profiling for generation pipeline

---

## Milestone Map

| Milestone | Status | Sprints |
| --------- | ------ | ------- |
| MS-01 Bootstrap | Complete | Sprint-001 |
| MS-02 Template Engine | Complete | Sprint-002 – 004 |
| MS-03 Registration Pipeline | Complete | Sprint-003 |
| MS-04 Project Generation | Complete | Sprint-005 – 007 |
| MS-05 Governance Templates | Complete | Sprint-008 |
| MS-06 Release Readiness | Complete | Sprint-009 – 010 |
| v0.2.0-alpha | Planned | Release |
| Diagnostics CLI | Planned | TBD |

---

## References

- [ARCHITECTURE.md](ARCHITECTURE.md) — current kernel architecture
- [CHANGELOG.md](CHANGELOG.md) — milestone-based change history
- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) — pre-release quality gate
- [ADR-001](docs/09-adr/ADR-001-rendering-and-file-writing-separation.md) — rendering and file writing separation
