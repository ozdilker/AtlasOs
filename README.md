# Atlas CLI

Command-line interface for Atlas OS — a private, AI-native Product Operating System for building and managing software products.

> Build once. Scale forever.

**Version:** `v0.1.0-alpha` (preparing `v0.2.0-alpha`)

## Requirements

- Node.js 22+
- pnpm 10+

## Quick Start

```bash
pnpm install
pnpm dev -- init MyProject
```

This creates a new Atlas project in the current directory with governance documents, scaffold directories, and validated generated files.

## Development

```bash
# Run CLI without building
pnpm dev -- --help
pnpm dev -- init MyProject

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
```

## Commands

| Command | Status |
| ------- | ------ |
| `atlas init <project-name>` | Implemented |

## Project Structure

```
src/
  commands/init/          CLI command registration
  diagnostics/            Validation rules and project diagnostics
  services/               Application services (init, generation, file I/O)
  templates/              Template engine, catalog, and rendering
  validators/             Input validation
tests/
  commands/               Command integration tests
  diagnostics/            Validation framework tests
  e2e/                    End-to-end CLI flow tests
  services/               Service and pipeline tests
  smoke/                  CLI subprocess smoke tests
  templates/              Template engine tests
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
