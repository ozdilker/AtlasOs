# Atlas CLI Release Checklist

Use this checklist before tagging a milestone release (for example `v0.2.0-alpha`).

---

## Architecture Review

- [ ] [ARCHITECTURE.md](ARCHITECTURE.md) reflects the current kernel layers and request flow
- [ ] Rendering remains separate from filesystem persistence per [ADR-001](docs/09-adr/ADR-001-rendering-and-file-writing-separation.md)
- [ ] New capabilities follow constructor injection and single-responsibility boundaries
- [ ] No business logic added to CLI command handlers beyond orchestration and UX

---

## ADR Compliance

- [ ] Template rendering does not write files directly
- [ ] `ProjectGenerationPipeline` produces in-memory `GenerationResult` only
- [ ] `FileService` is the sole persistence boundary for `atlas init`
- [ ] Diagnostics validate generated artifacts before persistence wiring completes

---

## Quality Gates

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes (unit, integration, E2E, and smoke)
- [ ] GitHub Actions CI workflow is green on the release branch

---

## Documentation

- [ ] [CHANGELOG.md](CHANGELOG.md) updated with milestone notes
- [ ] [ROADMAP.md](ROADMAP.md) updated with completed sprints and next milestone
- [ ] [README.md](README.md) quick-start instructions verified locally

---

## Release Steps

1. Confirm all checklist items above are complete
2. Bump version in `package.json` and `src/version.ts`
3. Create annotated git tag (for example `v0.2.0-alpha`)
4. Push tag to origin
5. Publish GitHub Release with changelog summary and test evidence
6. Verify `pnpm build` and packaged `dist/` output if distributing the CLI

---

## Post-Release

- [ ] Open follow-up issues for known technical debt
- [ ] Record milestone completion in project governance docs if required
