---
id: IP-001.PHASE-01
slug: "001-port_clickup_export_to_typescript_with_auth_fix-phase-01"
name: "Phase 1 – Build"
created: "2026-03-19"
updated: "2026-03-19"
status: complete
kind: phase
---

```yaml supekku:phase.overview@v1
schema: supekku.phase.overview
version: 1
phase: IP-001.PHASE-01
plan: IP-001
delta: DE-001
objective: >-
  Scaffold TypeScript project, implement all modules per DR-001, write unit tests
entrance_criteria:
  - DR-001 reviewed
exit_criteria:
  - All modules implemented per DR-001
  - Unit tests passing (VT-001)
  - Lints clean
  - CLI runs (smoke test with --help or invalid input)
verification:
  tests:
    - VT-001
  evidence: []
tasks:
  - id: "1.1"
    description: Scaffold TypeScript project
  - id: "1.2"
    description: Implement URL parsing
  - id: "1.3"
    description: Implement API client with error boundaries
  - id: "1.4"
    description: Implement tree assembly
  - id: "1.5"
    description: Implement JSON export
  - id: "1.6"
    description: Implement CLI entry point
  - id: "1.7"
    description: Unit tests
risks: []
```

```yaml supekku:phase.tracking@v1
schema: supekku.phase.tracking
version: 1
phase: IP-001.PHASE-01
```

# Phase 1 – Build

## 1. Objective

Implement the TypeScript clickup-export CLI per DR-001. All modules, unit-tested, linting clean.

## 2. Links & References

- **Delta**: [DE-001](../DE-001.md)
- **Design Revision**: [DR-001](../DR-001.md) — sections 4-5

## 3. Entrance Criteria

- [x] DR-001 reviewed

## 4. Exit Criteria / Done When

- [x] All source modules implemented
- [x] Unit tests passing (VT-001) — 16/16
- [x] Lint clean
- [x] CLI smoke test — no args → usage + exit 1; no token → graceful warning + exit 0

## 5. Verification

- Run: `npm test` (VT-001)
- Run: `npm run lint`
- Smoke: `npx clickup-export` with no args → usage message, exit 1

## 6. Assumptions & STOP Conditions

- Assumptions: Node.js ≥18 available, native `fetch` available (no HTTP library needed)
- STOP when: ClickUp API response shape contradicts DR-001 assumptions (defer to Phase 2 live test)

## 7. Tasks & Progress

| Status | ID  | Description | Parallel? | Notes |
| ------ | --- | --- | --- | --- |
| [x] | 1.1 | Scaffold TS project | | package.json, tsconfig, vitest, eslint |
| [x] | 1.2 | URL parsing | [P] | src/url.ts — 4 tests |
| [x] | 1.3 | API client | [P] | src/clickup.ts — 5 tests |
| [x] | 1.4 | Tree assembly | [P] | src/tree.ts — 7 tests |
| [x] | 1.5 | JSON export | [P] | src/export.ts |
| [x] | 1.6 | CLI entry point | | src/cli.ts |
| [x] | 1.7 | Unit tests | | 16/16 passing |

### Task Details

- **1.1 Scaffold**
  - package.json with `bin` entry, typescript, vitest, eslint
  - tsconfig.json — strict mode, ESM output
  - src/ directory structure per DR-001

- **1.2 URL parsing** (`src/url.ts`)
  - Extract list ID from `/l/{id}` path segment
  - Extract optional task ID from `pr` query param
  - Pure function, well-tested

- **1.3 API client** (`src/clickup.ts`)
  - `fetchClickUp(path, token)` → result type (ok/error, not throw)
  - `fetchAllTasks(listId, token)` → paginated accumulation
  - `fetchTask(taskId, token)` → single task fetch
  - All non-2xx: return error object, never throw

- **1.4 Tree assembly** (`src/tree.ts`)
  - `buildTree(tasks)` → TreeNode[]
  - Index by ID, group by parent, orphans become roots
  - Pure function, no I/O

- **1.5 JSON export** (`src/export.ts`)
  - `exportToDir(tree, tasks, dir)` → write tree.json + tasks/*.json
  - mkdir -p as needed

- **1.6 CLI** (`src/cli.ts`)
  - Arg parsing (positional: url, optional: output dir)
  - Env var: CLICKUP_API_TOKEN
  - Orchestrate: parse URL → fetch → build tree → export
  - Stderr for progress/warnings, no stdout noise

- **1.7 Unit tests**
  - Tree: various topologies, orphans, empty
  - URL: valid list, list+task, edge cases
  - API client: mock fetch, test error boundary behaviour
