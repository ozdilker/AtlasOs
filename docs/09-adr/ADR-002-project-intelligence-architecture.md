# ADR-002: Project Intelligence Architecture

| Field         | Value                                      |
| ------------- | ------------------------------------------ |
| **ID**        | ADR-002                                    |
| **Title**     | Project Intelligence Architecture            |
| **Status**    | Accepted                                   |
| **Date**      | 2026-07-10                                 |
| **Scope**     | Atlas CLI — Kernel                         |
| **Milestone** | Post Diagnostics Framework (Sprint-009)      |
| **Related**   | [ADR-001](ADR-001-rendering-and-file-writing-separation.md) |

---

## 1. Status

**Accepted**

This record governs the introduction of the Project Intelligence layer for Atlas CLI. It applies to all work that inspects, validates, diagnoses, or reports on Atlas projects beyond the narrow scope of template rendering and filesystem persistence.

This ADR complements [ADR-001](ADR-001-rendering-and-file-writing-separation.md). ADR-001 separates rendering from writing. ADR-002 separates project understanding from both.

---

## 2. Context

Atlas CLI has reached a functional project-generation milestone. The system currently:

- **Generates projects** through `ProjectGenerationPipeline`, producing in-memory `GenerationResult` artifacts (planned files, rendered content, directory structure).
- **Renders templates** through the Template Engine (`TemplateEngine`, `TemplateRegistry`, `TemplateInterpolator`) without filesystem side effects, per ADR-001.
- **Persists artifacts** through `FileService` and `FilesystemWriter`, which own directory creation, encoding, overwrite policy, and write reporting.
- **Validates generated artifacts** through an initial Diagnostics Framework (`ProjectValidator`, `ValidationRule`, `ValidationResult`) attached to `GenerationResult` after pipeline execution.

The Diagnostics Framework introduced in Sprint-009 validates **in-memory generation output** before persistence. It answers the question: *"Did the pipeline produce the expected artifact set?"* It does not answer broader project-health questions such as:

- Does an existing on-disk project conform to Atlas governance conventions?
- Have files drifted since initialization?
- Are required directories present after manual edits?
- Can the project be validated in CI without running `atlas init`?
- Can an IDE extension surface diagnostics without invoking the generation pipeline?

The next milestone introduces **project intelligence**: the ability to inspect, validate, diagnose, and report on Atlas projects as first-class operations independent of project creation.

The central question: **where should inspection, validation orchestration, and diagnostic reporting live?**

Without an explicit decision, implementation pressure tends to push validation logic into `FileService` (because it touches files), into `ProjectGenerationPipeline` (because it already produces `GenerationResult`), or into CLI command handlers (because users see the output). Each placement creates coupling that is difficult to reverse and limits reuse across CLI, CI, IDE, and API surfaces.

---

## 3. Decision

**Introduce a dedicated Project Intelligence layer.**

Project Intelligence is a kernel module family responsible for understanding Atlas projects. It owns:

| Concern                    | Owner in Project Intelligence |
| -------------------------- | ----------------------------- |
| Project inspection         | `Inspector`                   |
| Validation orchestration   | `Validator`                   |
| Diagnostic reporting       | `Reporter`                    |
| Rule definitions           | `Rules` (pluggable)           |
| Structured diagnostic data | `Diagnostics` (shared model)  |

The Project Intelligence layer **MUST NOT** render templates, **MUST NOT** perform filesystem persistence, and **MUST NOT** embed CLI-specific formatting logic in inspection or validation components.

**Generation remains independent.** `ProjectGenerationPipeline` continues to produce `GenerationResult`. It MAY invoke Project Intelligence for generation-time validation, but generation logic MUST NOT depend on filesystem inspection.

**FileService remains independent.** `FileService` continues to own persistence policy and write outcomes. It MUST NOT execute validation rules or produce diagnostic reports.

**CLI commands remain thin orchestrators.** Future commands (`atlas doctor`, `atlas validate`, `atlas inspect`, `atlas report`) MUST delegate to Project Intelligence services and MUST limit themselves to argument parsing, service invocation, exit-code mapping, and user-facing output delegation to `Reporter`.

### 3.1 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           CLI Layer                             │
│  atlas init · atlas doctor · atlas validate · atlas inspect     │
│  atlas report · argument parsing · exit codes                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Project Intelligence                          │
│                                                                 │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│   │  Inspector  │   │  Validator  │   │  Reporter   │          │
│   │             │   │             │   │             │          │
│   │  Collect    │──►│  Execute    │──►│  Convert    │          │
│   │  project    │   │  rules      │   │  diagnostics│          │
│   │  facts      │   │  against    │   │  to output  │          │
│   │             │   │  subject    │   │  formats    │          │
│   └──────┬──────┘   └──────┬──────┘   └─────────────┘          │
│          │                 │                                    │
│          │                 ▼                                    │
│          │          ┌─────────────┐                             │
│          └─────────►│    Rules    │                             │
│                     │  (pluggable)│                             │
│                     └──────┬──────┘                             │
│                            │                                    │
│                            ▼                                    │
│                     ┌─────────────┐                             │
│                     │ Diagnostics │                             │
│                     │  (model)    │                             │
│                     └─────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
          │                                    │
          │ reads                              │ MAY consume
          ▼                                    ▼
┌──────────────────┐              ┌──────────────────────────┐
│   Filesystem     │              │   GenerationResult         │
│   (via adapter)  │              │   (in-memory subject)      │
└──────────────────┘              └──────────────────────────┘

          Generation Pipeline and FileService operate in parallel;
          neither is a subordinate of Project Intelligence.
```

### 3.2 Component Contracts

#### Inspector

The `Inspector` **MUST** collect project information and produce a normalized **inspection subject** suitable for rule evaluation. The inspection subject **MUST** be expressible without reference to CLI arguments or terminal formatting.

For on-disk projects, the `Inspector` **MAY** read the filesystem through an injectable adapter. It **MUST NOT** write files or mutate project state.

For generation-time scenarios, the `Inspector` **MAY** accept `GenerationResult` directly as its subject without filesystem access.

#### Validator

The `Validator` **MUST** accept an inspection subject and a **validation profile** (ordered rule set). It **MUST** execute all applicable rules and **MUST** return a `ValidationResult` containing structured `Diagnostic` entries.

The `Validator` **MUST NOT** read the filesystem directly. It **MUST** operate only on the inspection subject provided by the `Inspector` or an equivalent in-memory adapter.

Rule implementations **MUST** conform to the `ValidationRule` contract: `validate(subject): Diagnostic[]`.

#### Reporter

The `Reporter` **MUST** convert `ValidationResult` (and optional inspection metadata) into output suitable for a target consumer. Supported targets **SHOULD** include:

- human-readable terminal output (default CLI)
- structured JSON (CI and API)
- SARIF or similar machine formats (future, optional)

The `Reporter` **MUST NOT** execute validation rules or inspect projects. It transforms diagnostics only.

#### Rules

Rules **MUST** be independently testable, stateless, and composable. New rules **MUST** be addable without modifying `Validator`, `Inspector`, or `Reporter` (Open/Closed Principle).

Rules **SHOULD** declare stable `code` identifiers, `severity`, optional `path`, and human-readable `message` values, consistent with the existing `Diagnostic` model in `src/diagnostics/`.

#### Diagnostics

The `Diagnostic` model **MUST** remain the canonical structured output of validation. Downstream consumers (CLI, CI, IDE, API) **MUST** be able to act on diagnostics without parsing human-readable strings.

---

## 4. Rationale

### 4.1 Separation of Concerns

Project generation, filesystem persistence, and project intelligence address different questions:

| Layer                  | Question                                              |
| ---------------------- | ----------------------------------------------------- |
| Generation Pipeline    | *What should this project contain when created?*      |
| FileService            | *How do we persist content safely and report writes?* |
| Project Intelligence   | *What is the state of this project, and is it valid?* |

Merging inspection or reporting into generation conflates **creation** with **evaluation**. Merging validation into `FileService` conflates **persistence policy** with **governance policy**. Merging intelligence into CLI handlers conflates **domain logic** with **presentation**.

A dedicated layer keeps each concern evolvable on its own lifecycle.

### 4.2 Open/Closed Principle

Atlas governance requirements will grow: new document types, directory conventions, metadata files, and cross-file consistency rules. A rule-based intelligence layer allows extension by adding new `ValidationRule` implementations and registering them in validation profiles.

Core orchestration (`Inspector`, `Validator`, `Reporter`) remains stable. Rules evolve independently. This mirrors the Template Engine pattern established in MS-02 and the Diagnostics Framework seed in Sprint-009.

### 4.3 Future CI Integration

Continuous integration environments need to validate Atlas projects without invoking interactive CLI flows or re-running project generation. A CI job **SHOULD** be able to:

```
atlas validate ./my-project --format json --fail-on error
```

Project Intelligence **MUST** support non-interactive execution with structured output and deterministic exit codes derived from `ValidationResult.hasErrors`. CI integration **MUST NOT** require the generation pipeline or `FileService` write paths.

### 4.4 Future IDE Integration

A VS Code extension or language server **SHOULD** consume the same `Diagnostic` model and rule set as the CLI. IDE surfaces benefit from:

- file-scoped diagnostics (`path` on `Diagnostic`)
- stable rule codes for suppression and documentation links
- inspection without project regeneration

Embedding intelligence in CLI handlers or the generation pipeline would force the IDE to duplicate logic or shell out to opaque text output. A shared intelligence layer enables programmatic embedding.

### 4.5 Future API Integration

Hosted Atlas services may expose project health endpoints (`GET /projects/:id/diagnostics`). API handlers **SHOULD** invoke the same `Inspector` and `Validator` as local CLI commands, then serialize results via `Reporter` in JSON form.

Intelligence logic **MUST NOT** assume a terminal, local filesystem layout, or Commander.js. Adapters **MAY** substitute object-storage-backed inspection subjects in cloud contexts, analogous to ADR-001's persistence adapter pattern for `FileService`.

### 4.6 Relationship to Existing Diagnostics Framework

Sprint-009 introduced `src/diagnostics/` with `ProjectValidator`, `ValidationRule`, and generation-time rules (`ReadmeExistsRule`, `GovernanceReadmeExistsRule`). This work is a **foundation**, not the final architecture.

Under this ADR:

- The `Diagnostic` model and `ValidationRule` contract **SHOULD** be preserved.
- `ProjectValidator` **SHOULD** evolve into or be wrapped by the intelligence-layer `Validator`.
- Generation-time validation **MAY** remain as a specialized validation profile applied to `GenerationResult`.
- On-disk validation **MUST** be implemented as additional rules operating on inspection subjects produced by `Inspector`.

Migration **SHOULD** consolidate under `src/intelligence/` over subsequent sprints without breaking existing generation behavior.

---

## 5. Consequences

### 5.1 Positive

- Inspection, validation, and reporting become reusable across CLI, CI, IDE, and API surfaces.
- New governance rules can be added without modifying generation, persistence, or CLI command structure.
- Generation-time and on-disk validation share rule implementations where applicable (e.g. README presence).
- Structured diagnostics enable deterministic exit codes, JSON export, and file-scoped editor highlights.
- Test suites can validate rules against pure in-memory subjects without filesystem or pipeline setup.
- Project Intelligence can be versioned and documented independently of `atlas init` behavior.

### 5.2 Negative

- A new module family (`src/intelligence/`) must be designed, implemented, and maintained.
- Existing `src/diagnostics/` code requires migration planning to avoid duplicate abstractions.
- Callers must select appropriate validation profiles (generation vs. on-disk vs. strict governance).
- Inspection of large projects may incur filesystem traversal cost; caching strategies may be required later.
- Multiple output formats increase `Reporter` maintenance surface.

### 5.3 Trade-offs

| Trade-off | Choice | Justification |
| --------- | ------ | ------------- |
| Single module vs. layered intelligence | Layered (`Inspector`, `Validator`, `Reporter`) | Slightly more structure; clear boundaries for testing and reuse |
| Inline validation vs. profile-based | Profile-based rule sets | Different contexts (init, doctor, CI) need different rule combinations |
| Human output in rules vs. in reporter | Reporter owns formatting | Rules stay machine-oriented; presentation varies by consumer |
| Migrate diagnostics immediately vs. incrementally | Incrementally | Preserves Sprint-009 behavior; reduces regression risk during MS-06 transition |
| Filesystem reads in Inspector vs. Validator | Inspector only | Validator stays pure; rules receive normalized subjects |

---

## 6. Alternatives Considered

### 6.1 Validation Inside FileService

**Proposal:** Extend `FileService.write()` to run validation rules before or after each write, rejecting persistence when diagnostics contain errors.

**Rejected because:**

- `FileService` owns persistence policy (overwrite, encoding, directories), not governance policy (required documents, scaffold conventions).
- Validation would execute only during writes. On-disk projects could not be diagnosed without a write operation.
- CI and IDE consumers would need to invoke `FileService` with synthetic write payloads to trigger validation — an unnatural and side-effect-prone API.
- Violates ADR-001 separation: `FileService` MUST remain a persistence boundary, not a governance gate.
- Couples rule changes to write-path changes, increasing regression risk in `atlas init`.

**Accepted approach:** `FileService` reports write outcomes only. Project Intelligence evaluates project state independently.

### 6.2 Validation Inside Generation Pipeline

**Proposal:** Expand `ProjectGenerationPipeline` to perform all current and future validation, including on-disk project checks, and embed reporting in `GenerationResult`.

**Rejected because:**

- The pipeline's responsibility is content generation. On-disk inspection is a different input domain (`GenerationResult` vs. project root directory).
- CLI commands such as `atlas doctor` would require running the generation pipeline against existing projects — wasteful, potentially destructive to in-memory state, and semantically incorrect.
- Reporting formats (terminal tables, JSON, SARIF) do not belong in generation output types.
- Violates Single Responsibility Principle and prevents CI/IDE reuse without importing the full generation graph.
- Creates pressure to add filesystem reads into the pipeline, breaking ADR-001's pure generation model.

**Accepted approach:** Generation MAY attach a generation-time `ValidationResult` by invoking intelligence-layer validation against `GenerationResult`. The pipeline MUST NOT become the sole owner of all validation concerns.

### 6.3 Validation Inside CLI

**Proposal:** Implement inspection, rule execution, and formatted output directly in command handlers (`commands/doctor/`, etc.).

**Rejected because:**

- Duplicates logic across every command that needs diagnostics.
- CLI handlers accumulate domain rules unrelated to argument parsing and exit codes.
- IDE and API consumers cannot reuse CLI handler logic without executing Commander.js.
- Unit testing requires command-level integration tests instead of focused rule and service tests.
- Formatting concerns interleave with governance rules, preventing structured output for CI.

**Accepted approach:** CLI handlers invoke Project Intelligence services and delegate output to `Reporter`.

### 6.4 Monolithic `DoctorService` Without Subcomponents

**Proposal:** Implement a single `DoctorService` that reads the filesystem, runs rules, and prints formatted output in one class.

**Rejected because:**

- Combines inspection, validation, and reporting — the same coupling this ADR avoids in other layers.
- Structured output (JSON) and alternate consumers require refactoring or duplicate code paths.
- Rule extension requires modifying the monolith rather than registering new rules.

**Accepted approach:** Separate `Inspector`, `Validator`, and `Reporter` with explicit data contracts between them.

---

## 7. Implementation Impact

### 7.1 Future Module Layout

The following layout **SHOULD** be introduced in subsequent sprints. Names are binding for planning purposes; exact interfaces require engineering specs.

```
src/intelligence/
├── index.ts                      # Public barrel exports
├── inspector/
│   ├── inspector.ts              # Inspector contract
│   ├── generation-inspector.ts   # Subject from GenerationResult
│   └── filesystem-inspector.ts   # Subject from on-disk project root
├── validator/
│   ├── validator.ts              # Validation orchestration
│   └── validation-profile.ts     # Named rule set definitions
├── reporter/
│   ├── reporter.ts               # Reporter contract
│   ├── terminal-reporter.ts      # Human-readable CLI output
│   └── json-reporter.ts          # Structured CI/API output
├── doctor/
│   └── doctor-service.ts         # Composes Inspector + Validator + Reporter
├── rules/
│   └── ...                       # Migrated and new ValidationRule implementations
└── types/
    ├── inspection-subject.ts     # Normalized input to rules
    └── diagnostic.ts             # Re-export or relocate from src/diagnostics/
```

### 7.2 Component Responsibilities

| Component | Responsibility | MUST NOT |
| --------- | -------------- | -------- |
| `Inspector` | Collect facts; build `InspectionSubject` | Render templates; write files; format output |
| `Validator` | Run profile rules; produce `ValidationResult` | Read filesystem directly; format output |
| `Reporter` | Format `ValidationResult` for a consumer | Execute rules; inspect projects |
| `DoctorService` | Orchestrate inspect → validate → report for health checks | Own rule logic; own persistence |
| `ValidationProfile` | Declare ordered rule sets for a context | Execute rules itself |

### 7.3 Validation Profiles

Validation profiles **SHOULD** define which rules apply in a given context:

| Profile | Typical use | Subject source |
| ------- | ----------- | -------------- |
| `generation-default` | Post-pipeline check during `atlas init` | `GenerationResult` |
| `project-standard` | On-disk health check (`atlas doctor`) | Filesystem inspector |
| `project-strict` | CI governance gate | Filesystem inspector |
| `inspect-only` | Informational (`atlas inspect`) | Filesystem inspector; MAY skip error-severity rules |

Profiles **MUST** be composable and **SHOULD** be extensible without modifying the `Validator` implementation.

### 7.4 Future CLI Commands

The following commands **SHOULD** be introduced as thin wrappers over Project Intelligence. None are in scope for the ADR acceptance sprint; this section defines architectural intent only.

| Command | Purpose | Intelligence path |
| ------- | ------- | ----------------- |
| `atlas doctor` | Health check with human-readable diagnostics | `DoctorService` + `terminal-reporter` |
| `atlas validate` | CI-oriented validation with exit codes | `Validator` + `json-reporter` or `terminal-reporter` |
| `atlas inspect` | Collect and display project facts | `Inspector` + informational reporter |
| `atlas report` | Full diagnostic report export | `DoctorService` + selectable reporter format |

All commands **MUST** use constructor injection for intelligence services in tests. Commands **MUST NOT** embed rule implementations.

### 7.5 Interaction with Existing Modules

| Existing module | Impact under ADR-002 |
| --------------- | -------------------- |
| `ProjectGenerationPipeline` | MAY call intelligence `Validator` with `generation-default` profile; MUST NOT embed rule logic long term |
| `InitProjectService` | Unchanged persistence orchestration; MAY surface validation warnings in future UX |
| `FileService` | No validation responsibilities added |
| `src/diagnostics/` | SHOULD migrate into `src/intelligence/`; types and rules preserved |
| `createDefaultProjectValidator()` | SHOULD evolve into profile-based factory |

### 7.6 Request Flow — `atlas doctor` (Future)

```
atlas doctor ./MyProject
        │
        ▼
┌──────────────────┐
│  CLI handler     │  Parse path, select profile, map exit code
└────────┬─────────┘
         ▼
┌──────────────────┐
│  DoctorService   │
└────────┬─────────┘
         │
         ├──► FilesystemInspector.inspect(projectRoot)
         │         └── InspectionSubject { files, directories, metadata }
         │
         ├──► Validator.validate(subject, project-standard profile)
         │         └── ValidationResult { diagnostics, hasErrors, hasWarnings }
         │
         └──► TerminalReporter.report(validationResult)
                   └── formatted stdout; exit code from hasErrors
```

Generation Pipeline and FileService are not invoked.

### 7.7 Interface Sketch (Non-binding)

```typescript
interface Inspector {
  inspect(source: InspectionSource): Promise<InspectionSubject>;
}

interface Validator {
  validate(subject: InspectionSubject, profile: ValidationProfile): ValidationResult;
}

interface Reporter {
  report(result: ValidationResult, options: ReportOptions): string;
}

interface DoctorService {
  diagnose(source: InspectionSource, profile: ValidationProfile, reporter: Reporter): DoctorResult;
}
```

Final interfaces require a separate engineering spec. The sketch is illustrative.

---

## 8. Compliance

The following requirements use [RFC 2119](https://datatracker.ietf.org/doc/html/rfc2119) terminology.

### 8.1 Project Intelligence Layer

- Project Intelligence **MUST** be implemented as a distinct kernel layer.
- Project Intelligence **MUST NOT** render templates or invoke `TemplateEngine` for persistence purposes.
- Project Intelligence **MUST NOT** write project files or invoke `FileService` for persistence purposes.
- The `Diagnostic` model **MUST** remain the canonical output of validation.
- Validation rules **MUST** be pluggable and independently testable.

### 8.2 Generation Pipeline

- `ProjectGenerationPipeline` **MUST** remain responsible for producing `GenerationResult`.
- Generation **MAY** invoke Project Intelligence for generation-time validation profiles.
- Generation **MUST NOT** become the sole owner of on-disk validation or diagnostic reporting.

### 8.3 FileService

- `FileService` **MUST** remain responsible for persistence only, per ADR-001.
- `FileService` **MUST NOT** execute governance validation rules.
- `FileService` **MAY** report write failures as operational errors distinct from governance diagnostics.

### 8.4 CLI Layer

- CLI commands **MUST** delegate inspection, validation, and report formatting to Project Intelligence services.
- CLI commands **MUST NOT** implement validation rules inline.
- CLI commands **SHOULD** map `ValidationResult.hasErrors` to non-zero exit codes for validate/doctor flows.

### 8.5 Extensibility

- New validation rules **MUST** be addable without modifying `Validator`, `Inspector`, or `Reporter` source.
- Validation profiles **SHOULD** be the mechanism for selecting rule sets per context.
- Reporters **SHOULD** be interchangeable for the same `ValidationResult`.

---

## 9. References

- [ADR-001: Rendering and File Writing Separation](ADR-001-rendering-and-file-writing-separation.md)
- Diagnostics Framework: `src/diagnostics/`
- Project Generation Pipeline: `src/services/project-generation/`
- File Service: `src/services/file/`
- Sprint-009: Diagnostics & Validation Framework
- Sprint-010: Release Readiness (MS-06)
- Atlas CLI Architecture: `ARCHITECTURE.md`

---

## 10. Revision History

| Version | Date       | Author       | Change             |
| ------- | ---------- | ------------ | ------------------ |
| 1.0     | 2026-07-10 | Atlas Kernel | Initial acceptance |
