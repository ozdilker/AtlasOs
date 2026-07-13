# Atlas CLI Architecture

This document describes the Atlas Kernel architecture as implemented through MS-07 (Project Intelligence).

Atlas CLI follows a layered architecture with strict separation between rendering and filesystem persistence ([ADR-001](docs/09-adr/ADR-001-rendering-and-file-writing-separation.md)) and a horizontal Project Intelligence layer for inspection and validation ([ADR-002](docs/09-adr/ADR-002-project-intelligence-architecture.md)).

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLI Layer                                  │
│  atlas init · atlas doctor · Commander.js · UX output · exit codes      │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Application Services                            │
│  InitProjectService · DoctorService · createInitProjectService()        │
│  createDoctorService()                                                  │
└───────────────┬─────────────────────────────────────┬───────────────────┘
                │                                     │
                ▼                                     ▼
┌───────────────────────────────┐     ┌───────────────────────────────────┐
│ Project Generation Pipeline   │     │ Project Intelligence              │
│ (in-memory generation)        │     │ Inspectors · ValidationEngine     │
│                               │     │ Profiles · Rules · Diagnostics    │
│                               │     │ ReporterRegistry · Reporters      │
└───────────────┬───────────────┘     └───────────────┬───────────────────┘
                │                                     │
                ▼                                     │ reads
┌───────────────────────────────┐                     │
│ Template Engine               │                     │
│ Catalog · Registry · Renderer │                     │
│ External Templates (optional) │                     │
└───────────────┬───────────────┘                     │
                │                                     │
                ▼                                     ▼
┌───────────────────────────────┐     ┌───────────────────────────────────┐
│ GenerationResult              │     │ InspectionSubject                 │
│ (rendered files + validation) │     │ (in-memory or filesystem-backed)  │
└───────────────┬───────────────┘     └───────────────────────────────────┘
                │
                ▼
┌───────────────────────────────┐
│ FileService                   │
│ (persistence only)            │
└───────────────┬───────────────┘
                ▼
┌───────────────────────────────┐
│ FilesystemWriter              │
│ (node:fs/promises adapter)    │
└───────────────────────────────┘
```

**Cross-cutting:** `AtlasConfigLoader` supplies `atlas.config.json` defaults to init template registration and doctor format resolution.

---

## Request Flow — `atlas init`

```
atlas init MyProject
        │
        ▼
┌──────────────────┐
│ validateProject  │  PascalCase name, reserved name rejection
│ Name()           │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ InitProject      │  Guard: project root must not exist
│ Service.execute  │
└────────┬─────────┘
         │
         ├──► registerInitTemplates(registry, baseDirectory)
         │         │
         │         ├── AtlasConfigLoader.load()
         │         ├── resolveTemplateDirectory()
         │         │
         │         ├── directory exists?
         │         │     yes → FilesystemTemplateLoader.load() → register external
         │         │     no  → TemplateCatalog.registerDefaults()
         │         └── on load error → fallback to built-in
         │
         ├──► ProjectGenerationPipeline.generate()
         │         │
         │         ├── ProjectScaffoldService.prepare()
         │         │     └── ProjectTemplateContext(projectName)
         │         │
         │         ├── DefaultTemplateEngine.render() per planned file
         │         │
         │         ├── GenerationInspector.inspect(GenerationResult)
         │         ├── ValidationEngine.validate() [generation-default profile]
         │         └── GenerationResult { files, validation, ... }
         │
         └──► FileService.write(baseDirectory, generationResult)
                   │
                   ├── FilesystemWriter.ensureDirectory() × N
                   └── FilesystemWriter.writeFile() × N
         │
         ▼
┌──────────────────┐
│ Success summary  │  Directories, created files, skipped files
└────────┬─────────┘
         ▼
┌──────────────────┐
│ Validation       │  formatInitValidationSummary(validation)
│ summary          │  Informational only — does not fail init
└──────────────────┘
```

Rendering, validation, and writing are sequential, independent operations composed by `InitProjectService`. No subordinate layer calls another inappropriately.

---

## Request Flow — `atlas doctor`

```
atlas doctor [path] [--format <format>]
        │
        ▼
┌──────────────────┐
│ AtlasConfigLoader│  doctor.format default
│ .load()          │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ ReporterRegistry │  terminal | json
│ .get(format)     │
└────────┬─────────┘
         ▼
┌──────────────────┐
│ DoctorService    │
│ .run(path)       │
└────────┬─────────┘
         │
         ├──► FilesystemInspector.inspect(projectRoot)
         │         └── FilesystemWalker + FilesystemReader
         │
         ├──► ValidationEngine.validate() [generation-default rules on disk]
         │
         └──► Reporter.report(ValidationEngineResult)
         │
         ▼
┌──────────────────┐
│ stdout + exit    │  exit 1 when hasErrors, else 0
└──────────────────┘
```

---

## Layer Responsibilities

### CLI Layer

**Location:** `src/commands/`, `src/cli.ts`, `src/index.ts`

| Responsibility | Detail |
| -------------- | ------ |
| Command registration | Commander.js program setup |
| Input validation | Delegates to `validateProjectName()` for init |
| User output | Success summary, validation summary, doctor reports |
| Exit codes | `1` on init failure or doctor validation errors |

The CLI layer contains no filesystem, template, or validation rule logic.

---

### Application Services

**Location:** `src/services/`, `src/intelligence/doctor/`

| Component | Responsibility |
| --------- | -------------- |
| `InitProjectService` | Orchestrates generation, validation exposure, then persistence |
| `createInitProjectService()` | Wires full init dependency graph via constructor injection |
| `DoctorService` | Orchestrates inspect → validate → report |
| `createDoctorService()` | Wires filesystem inspector, validation engine, reporter |
| `ProjectScaffoldService` | Prepares engine and context; defers template registration when pre-registered |

Application services compose kernel components. They do not render templates, evaluate rules, or write files directly.

---

### Project Intelligence

**Location:** `src/intelligence/`

Horizontal kernel layer governed by ADR-002 and SPEC-001.

| Module | Responsibility |
| ------ | -------------- |
| `inspectors/` | `GenerationInspector` (in-memory), `FilesystemInspector` (on disk) |
| `validation/` | `ValidationEngine`, `ValidationEngineResult`, result mapping |
| `profiles/` | `generationDefaultProfile` — rule sets for validation contexts |
| `rules/` | Existence rules (`readme-exists`, `governance-readme-exists`, etc.) |
| `reporters/` | `TerminalReporter`, `JsonReporter`, `ReporterRegistry` |
| `doctor/` | `DoctorService` orchestration |
| `filesystem/` | `FilesystemWalker`, `FilesystemReader` |

Project Intelligence **does not** invoke `TemplateEngine.render()` or `FileService.write()` for its core operations.

**ReporterRegistry** registers built-in reporters at factory startup:

| Format | Class | Consumer |
| ------ | ----- | -------- |
| `terminal` | `TerminalReporter` | `atlas doctor` (default) |
| `json` | `JsonReporter` | `atlas doctor --format json` |

---

### Configuration

**Location:** `src/config/`

| Component | Responsibility |
| --------- | -------------- |
| `AtlasConfig` | Typed config shape (`project`, `doctor`, `templates`) |
| `AtlasConfigLoader` | Loads `atlas.config.json` with deep-merge over defaults |
| `createDefaultConfig()` | Default values when config file is absent |

**Consumers:**

| Field | Used by |
| ----- | ------- |
| `templates.directory` | `registerInitTemplates()` via `resolveTemplateDirectory()` |
| `doctor.format` | `atlas doctor` default reporter format |
| `doctor.profile` | Defined in schema; not yet applied at runtime |

---

### Project Generation Pipeline

**Location:** `src/services/project-generation/`

| Component | Responsibility |
| --------- | -------------- |
| `ProjectGenerationPipeline` | Produces `GenerationResult` from a project name |
| `GenerationPlan` | Declares directories and planned files before I/O |
| `GenerationResult` | Rendered files, directories, `validation` |
| `GeneratedFile` | `relativePath`, `content`, `encoding` |
| `project-generated-files.ts` | Canonical mapping of paths to template IDs |

The pipeline performs no filesystem operations. Post-generation validation runs in-memory via Project Intelligence before the result is returned.

**Generated files:**

| File | Source |
| ---- | ------ |
| `README.md` | `readme` template |
| `CHANGELOG.md` | `changelog` template |
| `PROJECT-DASHBOARD.md` | `project-dashboard` template |
| `docs/00-governance/README.md` | `governance-index` template |
| `.gitignore` | Empty file |

---

### Template Engine

**Location:** `src/templates/`

| Component | Responsibility |
| --------- | -------------- |
| `TemplateCatalog` | Registers built-in templates into the registry |
| `InMemoryTemplateRegistry` | Stores `TemplateRegistration` objects by ID |
| `DefaultTemplateEngine` | Lookup + delegate to renderer |
| `StringTemplateRenderer` | Validates `StringTemplate`, delegates to interpolator |
| `TemplateInterpolator` | Replaces `{{projectName}}` placeholders |
| `ProjectTemplateContext` | Supplies `projectName` variable |

**External templates** (`src/templates/filesystem/`, `src/templates/config/`):

| Component | Responsibility |
| --------- | -------------- |
| `resolveTemplateDirectory()` | Resolves configured path, checks existence |
| `FilesystemTemplateLoader` | Loads `*.md` files as `TemplateRegistration[]` |
| `registerInitTemplates()` | External replace or built-in fallback policy |

Template ID is the lowercase filename stem (for example `README.md` → `readme`).

---

### File Service

**Location:** `src/services/file/`

| Component | Responsibility |
| --------- | -------------- |
| `FileService` | Accepts `GenerationResult`, orchestrates writes |
| `FilesystemWriter` | Low-level `node:fs/promises` adapter |
| `WriteOptions` | `overwrite`, `encoding`, `createDirectories` |
| `WriteResult` | `createdFiles`, `skippedFiles`, `createdDirectories`, `errors` |

**Overwrite policy:** `overwrite: false` (default). Existing files are skipped without modification.

The file service never renders templates or evaluates validation rules.

---

## Dependency Injection

All services are wired through constructor injection. No global state.

```
createInitProjectService(baseDirectory)
  ├── InMemoryTemplateRegistry
  ├── registerInitTemplates(registry, baseDirectory)
  ├── DefaultTemplateEngine(registry, renderer)
  ├── ProjectScaffoldService(catalog, registry, engine)
  ├── GenerationInspector
  ├── ValidationEngine(generationDefaultProfile.rules)
  ├── ProjectGenerationPipeline(scaffold, inspector, validationEngine)
  ├── FilesystemWriter
  ├── FileService(writer)
  └── InitProjectService(pipeline, fileService, writer, baseDirectory)

createDoctorService(reporter)
  ├── PathAwareFilesystemInspector(FilesystemReader)
  ├── ValidationEngine(generationDefaultProfile.rules)
  └── DoctorService(inspector, validationEngine, reporter)
```

---

## Directory Layout

```
src/
├── cli.ts / index.ts
├── commands/
│   ├── init/               Init command, validation summary formatter
│   └── doctor/             Doctor command
├── config/                 AtlasConfig, AtlasConfigLoader
├── diagnostics/            Shared Diagnostic types (legacy ProjectValidator retained)
├── intelligence/
│   ├── doctor/             DoctorService
│   ├── filesystem/         Walker, reader
│   ├── inspectors/         Generation, filesystem inspectors
│   ├── profiles/           Validation profiles
│   ├── reporters/          Terminal, JSON, registry
│   ├── rules/              Validation rules
│   └── validation/         ValidationEngine
├── services/
│   ├── file/               FileService, FilesystemWriter
│   ├── project-generation/ Pipeline, plans, results
│   ├── init-project-service.ts
│   └── create-init-project-service.ts
├── templates/
│   ├── catalog/            Built-in StringTemplate definitions
│   ├── config/             Template directory resolver, init registration
│   ├── context/            TemplateContext implementations
│   ├── engine/             Engine, renderer
│   ├── filesystem/         External template loader
│   ├── interpolation/      Variable replacement
│   ├── registration/       Registration models
│   └── registry/           Template storage
└── validators/             Input validation

docs/
├── 04-engineering/         SPEC-001 and engineering specs
└── 09-adr/                 Architecture Decision Records

tests/                      Vitest unit, integration, E2E, and smoke tests
```

---

## Design Principles

1. **Single Responsibility** — Each layer owns one concern.
2. **Rendering ≠ Writing** — ADR-001; strings before bytes.
3. **Intelligence is horizontal** — ADR-002; inspection and validation are not subordinate to generation or file I/O.
4. **Constructor Injection** — Explicit, testable wiring.
5. **Composition over inheritance** — Pipeline composes engine + intelligence; services compose pipeline + file service.
6. **Immutable generation input** — `GenerationResult` is not mutated by `FileService`.

---

## References

- [ADR-001: Rendering and File Writing Separation](docs/09-adr/ADR-001-rendering-and-file-writing-separation.md)
- [ADR-002: Project Intelligence Architecture](docs/09-adr/ADR-002-project-intelligence-architecture.md)
- [SPEC-001: Project Intelligence Technical Specification](docs/04-engineering/SPEC-001-project-intelligence-technical-specification.md)
- [ROADMAP.md](ROADMAP.md)
- [CHANGELOG.md](CHANGELOG.md)
