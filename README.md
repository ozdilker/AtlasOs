# Atlas CLI

Command-line interface for Atlas OS — a private, AI-native Product Operating System for building and managing software products.

> Build once. Scale forever.

**Version:** `v0.2.0-alpha` (preparing `v0.3.0-beta`)

## Requirements

- Node.js 22+
- pnpm 10+

## Quick Start

```bash
pnpm install
pnpm dev -- init MyProject
```

This creates a new Atlas project in the current directory with governance documents, scaffold directories, and post-generation validation output.

## Development

```bash
# Run CLI without building
pnpm dev -- --help
pnpm dev -- init MyProject
pnpm dev -- doctor

# Type-check
pnpm typecheck

# Lint
pnpm lint

# Test (unit, integration, E2E, smoke)
pnpm test
```

## Build

```bash
pnpm build
pnpm start -- --help
pnpm start -- init MyProject
pnpm start -- doctor ./MyProject
```

## Commands

| Command | Description |
| ------- | ----------- |
| `atlas init <project-name>` | Scaffold a new Atlas project with governance templates and validation summary |
| `atlas doctor [path]` | Diagnose an existing project on disk |
| `atlas doctor [path] --format terminal` | Human-readable diagnostic report (default) |
| `atlas doctor [path] --format json` | Machine-readable diagnostic report (schema version `1.0`) |

Project names must be PascalCase (for example `MyProject`).

## `atlas init`

Initializes a project through the generation pipeline and writes files to disk.

```bash
pnpm dev -- init MyProject
```

**What it does:**

1. Validates the project name
2. Generates scaffold directories (`docs/*`, `.atlas/`)
3. Renders governance templates (`README.md`, `CHANGELOG.md`, `PROJECT-DASHBOARD.md`, `docs/00-governance/README.md`, `.gitignore`)
4. Runs post-generation validation (Project Intelligence, `generation-default` profile)
5. Writes files via `FileService` (skip existing files by default)
6. Prints a success summary and validation summary

**Validation output** is informational only — init does not fail when validation reports errors.

Example success output:

```
Successfully initialized Atlas project: MyProject

Directories created: 13
  docs/00-governance/
  ...

Files created: 5
  README.md
  ...

------------------------------------
✔ Validation passed.
```

## `atlas doctor`

Inspects a project on disk and reports validation findings.

```bash
pnpm dev -- doctor ./MyProject
pnpm dev -- doctor ./MyProject --format json
```

**Format precedence:** CLI `--format` > `atlas.config.json` `doctor.format` > default (`terminal`).

Doctor exits with code `1` when validation reports errors, `0` otherwise.

## External Templates

Place Markdown templates in a directory and configure Atlas to load them during `atlas init`.

**Default directory:** `./templates` (relative to the working directory where init runs)

**Required template files** (filename stem becomes template ID):

| File | Template ID |
| ---- | ----------- |
| `README.md` | `readme` |
| `CHANGELOG.md` | `changelog` |
| `PROJECT-DASHBOARD.md` | `project-dashboard` |
| `governance-index.md` | `governance-index` |

Templates support `{{projectName}}` interpolation.

**Policy (MVP):** When the configured template directory exists, external templates **replace** built-in templates entirely. If the directory is missing or loading fails, built-in templates are used.

Example `templates/README.md`:

```markdown
# {{projectName}}

External README template.
```

## `atlas.config.json`

Optional project configuration. Loaded from the project root (for doctor) or working directory (for init template resolution).

```json
{
  "project": {},
  "doctor": {
    "profile": "generation-default",
    "format": "terminal"
  },
  "templates": {
    "directory": "./templates"
  }
}
```

| Field | Purpose |
| ----- | ------- |
| `doctor.format` | Default reporter format for `atlas doctor` (`terminal` or `json`) |
| `doctor.profile` | Reserved — not yet applied at runtime |
| `templates.directory` | Path to external Markdown templates for `atlas init` |

Missing config file → defaults are used.

## Validation

Atlas validates projects through the **Project Intelligence** layer:

| Context | Profile | Inspector |
| ------- | ------- | --------- |
| `atlas init` (post-generation) | `generation-default` | `GenerationInspector` (in-memory) |
| `atlas doctor` | `generation-default` (filesystem rules) | `FilesystemInspector` (on disk) |

**Rules (generation-default):** `readme-exists`, `governance-readme-exists`, `project-dashboard-exists`, `changelog-exists`, `gitignore-exists`

Init displays a concise validation summary. Doctor uses `ReporterRegistry` reporters:

- **Terminal** — status, counts, diagnostics
- **JSON** — structured report with `schemaVersion`, `status`, `summary`, `diagnostics`

## Project Structure

```
src/
  commands/
    init/                 atlas init command and validation summary formatter
    doctor/               atlas doctor command
  config/                 atlas.config.json loader and defaults
  diagnostics/            Shared diagnostic types (legacy validator retained)
  intelligence/           Project Intelligence (inspectors, validation, reporters, doctor)
  services/               Application services (init, generation, file I/O)
  templates/
    catalog/              Built-in templates
    config/               Template directory resolver, init registration
    filesystem/           External template loader
    engine/               Template engine and renderer
  validators/             Input validation
tests/
  commands/               Command integration tests
  config/                 Config loader tests
  e2e/                    End-to-end CLI flow tests
  intelligence/           Project Intelligence tests
  services/               Service and pipeline tests
  smoke/                  CLI subprocess smoke tests
  templates/              Template engine and filesystem loader tests
.github/workflows/        CI (typecheck, lint, test)
```

## Quality

CI runs on every push and pull request:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

See [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) before milestone releases.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — kernel architecture
- [ROADMAP.md](ROADMAP.md) — milestone plan
- [CHANGELOG.md](CHANGELOG.md) — release history
- [docs/09-adr/](docs/09-adr/) — Architecture Decision Records
- [docs/04-engineering/SPEC-001-project-intelligence-technical-specification.md](docs/04-engineering/SPEC-001-project-intelligence-technical-specification.md) — Project Intelligence specification
