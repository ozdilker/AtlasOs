# Atlas CLI Architecture

This document describes the Atlas Kernel architecture as implemented through Sprint-008 (Engineering Checkpoint EC-001).

Atlas CLI follows a layered architecture with strict separation between rendering and filesystem persistence, governed by [ADR-001](docs/09-adr/ADR-001-rendering-and-file-writing-separation.md).

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                           CLI Layer                             │
│  Commander.js · command registration · validation · UX output   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Application Services                        │
│  InitProjectService · createInitProjectService()                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│ Project Generation        │   │ File Service                  │
│ Pipeline                  │   │ (persistence only)            │
│ (content generation)      │   │                               │
└───────────────┬───────────┘   └───────────────┬───────────────┘
                │                               │
                ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│ Template Engine           │   │ Filesystem Writer             │
│                           │   │ (node:fs/promises adapter)    │
└───────────────┬───────────┘   └───────────────┬───────────────┘
                │                               │
                ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│ Renderer + Interpolator     │   │ Filesystem                    │
│ (string output)             │   │                               │
└───────────────────────────┘   └───────────────────────────────┘
```

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
         ├──► ProjectGenerationPipeline.generate()
         │         │
         │         ├── ProjectScaffoldService.prepare()
         │         │     ├── TemplateCatalog.registerDefaults()
         │         │     └── ProjectTemplateContext(projectName)
         │         │
         │         └── For each templated file:
         │               DefaultTemplateEngine.render(templateId, context)
         │                     │
         │                     ├── TemplateRegistry.get()
         │                     ├── StringTemplateRenderer.render()
         │                     └── TemplateInterpolator.interpolate()
         │
         │         └── GenerationResult { generatedFiles, directories, plan }
         │
         └──► FileService.write(baseDirectory, generationResult)
                   │
                   ├── FilesystemWriter.ensureDirectory() × N
                   └── FilesystemWriter.writeFile() × N
         │
         ▼
┌──────────────────┐
│ Success summary  │  Directories, created files, skipped files
└──────────────────┘
```

Rendering and writing are sequential, independent operations composed by `InitProjectService`. Neither subordinate layer calls the other.

---

## Layer Responsibilities

### CLI Layer

**Location:** `src/commands/`, `src/cli.ts`, `src/index.ts`

| Responsibility | Detail |
| -------------- | ------ |
| Command registration | Commander.js program setup |
| Input validation | Delegates to `validateProjectName()` |
| User output | Success summary, error messages (no stack traces) |
| Exit codes | `process.exitCode = 1` on failure |

The CLI layer contains no filesystem or template logic.

---

### Application Services

**Location:** `src/services/init-project-service.ts`, `src/services/create-init-project-service.ts`

| Component | Responsibility |
| --------- | -------------- |
| `InitProjectService` | Orchestrates generation then persistence |
| `createInitProjectService()` | Wires full dependency graph via constructor injection |
| `ProjectScaffoldService` | Registers catalog defaults, creates context, exposes `renderReadme()` |

Application services compose kernel components. They do not render templates or write files directly.

---

### Project Generation Pipeline

**Location:** `src/services/project-generation/`

| Component | Responsibility |
| --------- | -------------- |
| `ProjectGenerationPipeline` | Produces `GenerationResult` from a project name |
| `GenerationPlan` | Declares directories and planned files before I/O |
| `GenerationResult` | Rendered files, directories, warnings, errors |
| `GeneratedFile` | `relativePath`, `content`, `encoding` |
| `project-generated-files.ts` | Canonical mapping of paths to template IDs |

The pipeline performs no filesystem operations. Output is in-memory strings and metadata.

**Generated files (Sprint-008):**

| File | Source |
| ---- | ------ |
| `README.md` | `readme` template (interpolated) |
| `CHANGELOG.md` | `changelog` template |
| `PROJECT-DASHBOARD.md` | `project-dashboard` template |
| `docs/00-governance/README.md` | `governance-index` template |
| `.gitignore` | Empty file |

---

### Template Engine

**Location:** `src/templates/`

| Component | Responsibility |
| --------- | -------------- |
| `TemplateCatalog` | Registers default templates into the registry |
| `InMemoryTemplateRegistry` | Stores `TemplateRegistration` objects by ID |
| `DefaultTemplateEngine` | Lookup + delegate to renderer |
| `StringTemplateRenderer` | Validates `StringTemplate`, delegates to interpolator |
| `TemplateInterpolator` | Replaces `{{projectName}}` placeholders |
| `ProjectTemplateContext` | Supplies `projectName` variable |
| `*Template` classes | Static `StringTemplate` content definitions |

**Registration model:**

```
TemplateRegistration
  ├── id
  ├── template (StringTemplate)
  └── metadata (version, category, tags, description)
```

**Supported templates:**

| ID | Class |
| -- | ----- |
| `readme` | `ReadmeTemplate` |
| `changelog` | `ChangelogTemplate` |
| `project-dashboard` | `ProjectDashboardTemplate` |
| `governance-index` | `GovernanceIndexTemplate` |

---

### Renderer

**Location:** `src/templates/engine/string-template-renderer.ts`, `src/templates/interpolation/`

The renderer layer transforms `StringTemplate.content` + `TemplateContext` into a final string.

```
StringTemplate.content
        │
        ▼
TemplateInterpolator.interpolate()
        │
        ├── {{projectName}} → context value
        └── unknown variable → MissingTemplateVariableError
        │
        ▼
Rendered string
```

No markdown parsing. No Handlebars or Mustache. Single-variable interpolation only.

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

The file service never renders templates or modifies content.

---

### Filesystem

**Location:** OS disk via `FilesystemWriter`

| Operation | Implementation |
| --------- | -------------- |
| Directory creation | `mkdir({ recursive: true })` |
| File creation | `writeFile` with `'wx'` flag (exclusive) |
| Encoding | UTF-8 default |

---

## Dependency Injection

All services are wired through constructor injection. No global state.

```
createInitProjectService()
  ├── InMemoryTemplateRegistry
  ├── TemplateCatalog
  ├── TemplateInterpolator
  ├── StringTemplateRenderer(interpolator)
  ├── DefaultTemplateEngine(registry, renderer)
  ├── ProjectScaffoldService(catalog, registry, engine)
  ├── ProjectGenerationPipeline(scaffoldService)
  ├── FilesystemWriter
  ├── FileService(writer)
  └── InitProjectService(pipeline, fileService, writer)
```

---

## Directory Layout

```
src/
├── commands/init/          CLI command handlers
├── services/
│   ├── file/               FileService, FilesystemWriter
│   ├── project-generation/ Pipeline, plans, results
│   ├── init-project-service.ts
│   └── create-init-project-service.ts
├── templates/
│   ├── catalog/            StringTemplate definitions
│   ├── context/            TemplateContext implementations
│   ├── engine/             Engine, renderer
│   ├── interpolation/      Variable replacement
│   ├── registration/       Registration models
│   └── registry/           Template storage
└── validators/             Input validation

docs/
└── 09-adr/                 Architecture Decision Records

tests/                      Vitest unit and integration tests
```

---

## Design Principles

1. **Single Responsibility** — Each layer owns one concern.
2. **Rendering ≠ Writing** — ADR-001; strings before bytes.
3. **Constructor Injection** — Explicit, testable wiring.
4. **Composition over inheritance** — Pipeline composes engine + context; service composes pipeline + file service.
5. **Immutable generation input** — `GenerationResult` is not mutated by `FileService`.

---

## References

- [ADR-001: Rendering and File Writing Separation](docs/09-adr/ADR-001-rendering-and-file-writing-separation.md)
- [ROADMAP.md](ROADMAP.md)
- [CHANGELOG.md](CHANGELOG.md)
