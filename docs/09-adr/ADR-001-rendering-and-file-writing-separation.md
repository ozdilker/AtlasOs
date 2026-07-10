# ADR-001: Rendering and File Writing Separation

| Field       | Value                                      |
| ----------- | ------------------------------------------ |
| **ID**      | ADR-001                                    |
| **Title**   | Rendering and File Writing Separation      |
| **Status**  | Accepted                                   |
| **Date**    | 2026-07-10                                 |
| **Scope**   | Atlas CLI — Kernel                         |
| **Milestone** | Post Template Engine (Sprint-004)        |

---

## 1. Status

**Accepted**

This record is the first Kernel ADR following completion of the Template Engine milestone. It governs all subsequent work that introduces filesystem output to Atlas CLI.

---

## 2. Context

Atlas CLI has reached a functional Template Engine milestone. The system can:

- register templates through `TemplateRegistry` and `TemplateCatalog`
- resolve project variables through `TemplateContext` (e.g. `ProjectTemplateContext`)
- interpolate supported placeholders through `TemplateInterpolator`
- render registered templates to final strings through `StringTemplateRenderer` and `DefaultTemplateEngine`
- produce rendered output at the service layer via `ProjectScaffoldService.renderReadme()`

Rendering is presently a pure transformation: template content and context enter the pipeline; a string exits. No component in the rendering path performs filesystem I/O.

The next milestone introduces filesystem writing. Project initialization must persist rendered content (e.g. `README.md`) and create directory structures on disk. A boundary decision is required before that work begins.

The central question: **should rendering also write files?**

Without an explicit decision, implementation pressure tends to push `writeFile` calls into renderers, engines, or command handlers. That coupling is difficult to reverse and propagates filesystem assumptions through layers that should remain environment-agnostic.

---

## 3. Decision

**Rendering MUST NOT know about the filesystem.**

The rendering pipeline returns content only. It produces `string` values. It does not create directories, open file handles, choose encodings, enforce overwrite policy, or report write outcomes.

Filesystem concerns are owned by a separate **`FileService`** (name provisional; interface to be defined in a subsequent sprint). `FileService` is solely responsible for:

| Concern            | Owner        |
| ------------------ | ------------ |
| Directory creation | `FileService` |
| Overwrite policy   | `FileService` |
| Character encoding | `FileService` |
| Atomic writes      | `FileService` |
| Write reporting    | `FileService` |

The orchestration layer (e.g. `ProjectScaffoldService`, future `InitCommand` handlers) coordinates rendering and writing as sequential, independent steps:

```
render(templateId, context) → string
write(path, content, policy) → WriteResult
```

Rendering and writing are composed. They are not merged.

---

## 4. Rationale

### 4.1 Single Responsibility Principle

Rendering transforms data. Writing persists data. These are distinct operations with distinct failure modes, invariants, and policies.

A renderer that also writes files violates SRP. It must understand template syntax, variable resolution, path conventions, overwrite rules, and I/O error handling in a single unit. Changes to any one concern force changes to the whole.

Separating the two keeps each module focused and reduces regression surface.

### 4.2 Testability

The current rendering pipeline is fully testable without temporary directories, file cleanup, or platform-specific path handling. Unit tests assert on string equality. This property must be preserved.

`FileService` can be tested independently with isolated filesystem fixtures or in-memory adapters. Integration tests compose both layers at the orchestration boundary.

Injecting a `FileService` mock into orchestration code allows command-level tests to verify rendering and write policy without touching disk.

### 4.3 Reuse

Rendered strings are useful outside filesystem contexts:

- snapshot testing of template output
- dry-run previews
- diff generation before overwrite
- piping output to other tools

If rendering is coupled to writing, these use cases require filesystem side effects or conditional bypass logic. A string-returning renderer is reusable by default.

### 4.4 Web and API Compatibility

Atlas OS is not exclusively a local CLI. Future surfaces may include HTTP APIs, hosted generators, and remote project scaffolding. Those environments may persist output to object storage, databases, or in-memory buffers—not the local filesystem.

A renderer that calls `fs.writeFile` cannot operate in those contexts without modification. A renderer that returns a string operates unchanged; only the persistence adapter differs.

### 4.5 Future Cloud Rendering

Cloud-based rendering (server-side template resolution, remote variable injection) is a string-in/string-out operation. File writing in cloud contexts is a separate deployment concern (e.g. S3 upload, git commit API).

Decoupling rendering from I/O allows the Template Engine to run in CI, serverless functions, or worker processes without filesystem mounts.

### 4.6 Future VS Code Extension

A VS Code extension may preview rendered templates in an editor panel, offer "Apply to workspace" actions, or show diffs before save. Preview requires rendered strings without writes. Apply requires writes without re-rendering.

A single-responsibility rendering pipeline supports both flows from the same core logic.

---

## 5. Consequences

### 5.1 Positive

- Rendering remains pure and deterministic given fixed template and context input.
- Unit test suites for the Template Engine require no filesystem setup.
- `FileService` can evolve independently (atomic writes, backup, dry-run) without touching template code.
- Multiple output targets (disk, stdout, API response) can consume the same rendered string.
- Orchestration code explicitly documents the render-then-write sequence, improving auditability.

### 5.2 Negative

- Callers must coordinate two operations instead of one. Orchestration code grows slightly.
- Rendered content may exist in memory before persistence. Large templates increase transient memory use (acceptable at current scale).
- A dedicated `FileService` module must be designed, implemented, and maintained.
- Existing filesystem logic in early sprint code (e.g. `init-project.ts`) must be refactored toward `FileService` over time.

### 5.3 Trade-offs

| Trade-off | Choice | Justification |
| --------- | ------ | ------------- |
| Simplicity at call site vs. layer purity | Layer purity | Short-term convenience of combined render-and-write creates long-term coupling |
| One module vs. two modules | Two modules | Marginal increase in file count; significant decrease in cross-cutting concerns |
| In-memory string vs. streaming write | In-memory string | Current templates are small; streaming can be added to `FileService` if needed |

---

## 6. Alternatives Considered

### 6.1 Renderer Writes Files Directly

**Proposal:** Extend `StringTemplateRenderer` (or a successor) to accept a target path and call `fs.writeFile` after interpolation.

**Rejected because:**

- Renderer becomes untestable without filesystem fixtures.
- Renderer must accept path, encoding, and overwrite policy parameters unrelated to template content.
- Reuse in preview, API, and extension contexts requires bypass flags or duplicate renderer implementations.
- Violates the established renderer contract: `render(template, context): string`.

### 6.2 TemplateEngine Writes Files

**Proposal:** Add `renderToFile(templateId, context, path)` to `DefaultTemplateEngine`.

**Rejected because:**

- Engine becomes an orchestration-and-persistence hybrid.
- Registry lookup and rendering—engine's current scope—become coupled to I/O policy.
- Engine consumers that need strings only (tests, previews) must use a different code path or accept unnecessary side effects.
- Expands engine interface surface without corresponding rendering benefit.

### 6.3 CLI Writes Files Directly

**Proposal:** Command handlers call `engine.render()` and inline `fs.writeFile` / `fs.mkdir` without a `FileService`.

**Rejected because:**

- Filesystem policy (overwrite protection, atomic writes, encoding) is duplicated across commands.
- CLI handlers accumulate infrastructure logic unrelated to argument parsing and user feedback.
- Policy changes require edits in every command rather than one service.
- Does not provide a testable, injectable abstraction for write behavior.

**Accepted approach:** CLI and service orchestrators call `engine.render()` for content, then delegate persistence to `FileService`.

---

## 7. Implementation Impact

### 7.1 Modules That Will Use `FileService`

| Module | Role |
| ------ | ---- |
| **`ProjectScaffoldService`** (extended) | Orchestrates `renderReadme()` then `FileService.write()` for project root files |
| **`InitProjectService`** (future refactor of `init-project.ts`) | Creates directory scaffold via `FileService.createDirectories()`; writes rendered and empty files via `FileService` |
| **`InitCommand` handler** (`commands/init/`) | Invokes scaffold service; surfaces `FileService` write reports to the user |
| **Future template writers** | Any command that persists rendered template output (CHANGELOG, config stubs) |

### 7.2 Modules That Will NOT Use `FileService`

| Module | Role |
| ------ | ---- |
| `TemplateInterpolator` | Variable resolution only |
| `StringTemplateRenderer` | Content transformation only |
| `DefaultTemplateEngine` | Registry lookup and render delegation only |
| `TemplateRegistry` / `InMemoryTemplateRegistry` | In-memory template storage only |
| `TemplateCatalog` | Template registration definitions only |
| `ProjectTemplateContext` | Variable provision only |

### 7.3 Refactoring Notes

`src/services/init-project.ts` currently performs direct filesystem operations (`mkdir`, `writeFile`). This predates the Template Engine milestone. It is not a violation of this ADR at acceptance time, but it is **technical debt**. Future sprints must migrate directory creation and file writing from `init-project.ts` into `FileService`, and migrate README content generation from `generate-readme.ts` into the Template Engine pipeline already established by `ProjectScaffoldService.renderReadme()`.

The target end state for `atlas init`:

```
InitCommand
  → InitProjectService
      → ProjectScaffoldService.renderReadme(projectName)   // string
      → FileService.createDirectories(structure)           // directories
      → FileService.writeFile('README.md', content, policy)
      → FileService.writeFile('CHANGELOG.md', '', policy)
      → FileService.writeFile('.gitignore', '', policy)
```

Rendering and writing remain separate calls within the orchestrator. Neither subordinate module calls the other.

### 7.4 Interface Sketch (Non-binding)

This ADR does not define `FileService` implementation. A future ADR or engineering spec may formalize:

```typescript
interface FileService {
  createDirectories(paths: readonly string[], basePath: string): Promise<void>;
  writeFile(path: string, content: string, options: WriteOptions): Promise<WriteResult>;
}
```

The sketch is illustrative. Final interfaces require a separate design task.

---

## References

- Atlas CLI Template Engine: `src/templates/`
- `ProjectScaffoldService.renderReadme()`: `src/services/project-scaffold-service.ts`
- Project scaffold paths: `src/services/init-project.ts`
- Sprint-004: Template Rendering Pipeline completion

---

## Revision History

| Version | Date       | Author      | Change          |
| ------- | ---------- | ----------- | --------------- |
| 1.0     | 2026-07-10 | Atlas Kernel | Initial acceptance |
