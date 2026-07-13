# Atlas CLI Roadmap

Engineering roadmap for the Atlas CLI kernel. This document tracks completed milestones, the active release target, and planned work.

**Current version:** `v0.2.0-alpha`  
**Target release:** `v0.3.0-beta` (MS-07 complete)

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

### MS-07 — Project Intelligence

**Sprints:** Sprint-011 through Sprint-014 (MS-07A–MS-07G)

Horizontal kernel layer for project inspection, validation, and reporting per [ADR-002](docs/09-adr/ADR-002-project-intelligence-architecture.md) and [SPEC-001](docs/04-engineering/SPEC-001-project-intelligence-technical-specification.md).

- **Intelligence core:** `GenerationInspector`, `FilesystemInspector`, `ValidationEngine`, `generation-default` profile, five existence rules
- **Pipeline integration:** Intelligence validation attached to `GenerationResult.validation`
- **Doctor:** `DoctorService`, `atlas doctor` command, filesystem walker and reader
- **Reporters:** `TerminalReporter`, `JsonReporter`, `ReporterRegistry`, `--format` flag and config default
- **Configuration:** `atlas.config.json`, `AtlasConfigLoader`, deep-merge defaults
- **External templates:** `resolveTemplateDirectory`, `FilesystemTemplateLoader`, `registerInitTemplates` in init flow
- **Init UX:** Post-init validation summary (informational, non-blocking)
- **Beta documentation sync:** README, ARCHITECTURE, ROADMAP, CHANGELOG, RELEASE_CHECKLIST

---

## Upcoming Milestones

### v0.3.0-beta Release

Tag and publish the milestone incorporating MS-07 work.

- Version bump (`package.json`, `src/version.ts`)
- GitHub Release with changelog summary
- Manual smoke verification (`pnpm build`, `pnpm start -- init`, `pnpm start -- doctor`)
- Distribution verification (`dist/` output)

### MS-08 — Developer Experience

**Status:** Planned (not started)

Improve day-to-day development workflows around Atlas projects and the CLI itself.

- Unified diagnostic formatting across `atlas init` and `atlas doctor`
- Wire `doctor.profile` from config to validation profile selection
- `project-standard` profile for filesystem doctor checks (per SPEC-001)
- Template merge policy (`replace` vs `overlay`) for external templates
- Init validation policy options (inform vs block)
- CLI help improvements, shell completions, and developer tooling
- Documentation site or extended playbook integration

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
| MS-07 Project Intelligence | Complete | Sprint-011 – 014 |
| v0.3.0-beta | Planned | Release |
| MS-08 Developer Experience | Planned | TBD |

---

## References

- [ARCHITECTURE.md](ARCHITECTURE.md) — current kernel architecture
- [CHANGELOG.md](CHANGELOG.md) — milestone-based change history
- [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) — pre-release quality gate
- [ADR-001](docs/09-adr/ADR-001-rendering-and-file-writing-separation.md) — rendering and file writing separation
- [ADR-002](docs/09-adr/ADR-002-project-intelligence-architecture.md) — project intelligence architecture
- [SPEC-001](docs/04-engineering/SPEC-001-project-intelligence-technical-specification.md) — project intelligence technical specification
