# Atlas CLI

Command-line interface for Atlas OS.

**Version:** `v0.1.0-alpha`

## Requirements

- Node.js 22+
- pnpm

## Setup

```bash
pnpm install
```

## Development

```bash
# Run CLI without building
pnpm dev -- --help

# Type-check
pnpm typecheck

# Lint and format
pnpm lint
pnpm format

# Test
pnpm test
```

## Build

```bash
pnpm build
pnpm start -- --help
```

## Commands

| Command     | Status        |
| ----------- | ------------- |
| `atlas init` | Registered (Sprint-002+) |

## Project Structure

```
src/
  commands/init/   Command registration
  core/            Core CLI infrastructure (future)
  templates/       Project templates (future)
  services/        Business services (future)
  validators/      Input validation (future)
  types/           Shared TypeScript types (future)
  utils/           Shared utilities (future)
tests/             Vitest test suite
```
