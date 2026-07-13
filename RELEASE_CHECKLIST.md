# Atlas CLI Release Checklist

Use this checklist before tagging a milestone release (for example `v0.3.0-beta`).

---

## Architecture Review

- [ ] [ARCHITECTURE.md](ARCHITECTURE.md) reflects CLI → Services → Project Intelligence → Template Engine → Generation Pipeline → FileService
- [ ] Rendering remains separate from filesystem persistence per [ADR-001](docs/09-adr/ADR-001-rendering-and-file-writing-separation.md)
- [ ] Project Intelligence is documented as a horizontal layer per [ADR-002](docs/09-adr/ADR-002-project-intelligence-architecture.md)
- [ ] New capabilities follow constructor injection and single-responsibility boundaries
- [ ] No business logic added to CLI command handlers beyond orchestration and UX

---

## ADR Compliance

- [ ] Template rendering does not write files directly
- [ ] `ProjectGenerationPipeline` produces in-memory `GenerationResult` only
- [ ] `FileService` is the sole persistence boundary for `atlas init`
- [ ] Project Intelligence does not invoke `TemplateEngine.render()` or `FileService.write()` for core operations
- [ ] Post-generation validation runs via `GenerationInspector` + `ValidationEngine` before persistence wiring completes

---

## Quality Gates

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes (unit, integration, E2E, and smoke)
- [ ] GitHub Actions CI workflow is green on the release branch

---

## Documentation

- [ ] [README.md](README.md) documents `atlas init`, `atlas doctor`, external templates, `atlas.config.json`, validation, and JSON reporter
- [ ] [CHANGELOG.md](CHANGELOG.md) includes release notes for the target version
- [ ] [ROADMAP.md](ROADMAP.md) marks completed milestone and next planned work
- [ ] [ARCHITECTURE.md](ARCHITECTURE.md) includes ReporterRegistry, Config, and External Templates
- [ ] Quick-start instructions verified locally

---

## Manual Smoke

Run these commands against a clean temp directory before tagging:

```bash
pnpm build
pnpm start -- --help
pnpm start -- init SmokeProject
pnpm start -- doctor ./SmokeProject
pnpm start -- doctor ./SmokeProject --format json
```

Verify:

- [ ] Init creates scaffold directories and governance files
- [ ] Init prints validation summary (`✔ Validation passed.` for a clean run)
- [ ] Doctor terminal report shows `PASS` for a valid project
- [ ] Doctor JSON output is valid JSON with `schemaVersion` `1.0`
- [ ] Doctor exits `0` for a valid project, `1` when errors are present

---

## Version Tag

1. Confirm all checklist items above are complete
2. Bump version in `package.json` and verify `src/version.ts` reads from it
3. Create annotated git tag (for example `v0.3.0-beta`)
4. Push tag to origin

---

## GitHub Release

1. Publish GitHub Release from the annotated tag
2. Include changelog summary from [CHANGELOG.md](CHANGELOG.md)
3. Attach test evidence (CI green, smoke command output or screenshot)
4. Verify `pnpm build` and packaged `dist/` output if distributing the CLI

---

## Post-Release

- [ ] Open follow-up issues for known technical debt (see ROADMAP MS-08)
- [ ] Record milestone completion in project governance docs if required

---

## Known Limitations (v0.3.0-beta)

Document these for release notes; they are acceptable for beta but tracked for MS-08:

- `doctor.profile` in `atlas.config.json` is not yet applied at runtime
- `atlas init` does not fail when post-generation validation reports errors (informational only)
- External templates use replace policy — empty external directory yields no templates
- Legacy `src/diagnostics/ProjectValidator` retained alongside Project Intelligence (not on hot path)
- Doctor uses `generation-default` rules on filesystem subjects; `project-standard` profile not yet implemented
