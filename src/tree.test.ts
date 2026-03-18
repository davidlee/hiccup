import { describe, it, expect } from "vitest"
import { buildTree } from "./tree.js"
import type { ClickUpTask } from "./types.js"

function task(id: string, name: string, parent: string | null = null): ClickUpTask {
  return { id, name, parent, status: { status: "open" } }
}

describe("buildTree", () => {
  it("returns empty array for empty input", () => {
    expect(buildTree([])).toEqual([])
  })

  it("returns flat list as roots when no parents", () => {
    const tasks = [task("1", "A"), task("2", "B")]
    const tree = buildTree(tasks)

    expect(tree).toHaveLength(2)
    expect(tree[0].id).toBe("1")
    expect(tree[0].children).toEqual([])
    expect(tree[1].id).toBe("2")
  })

  it("nests children under parents", () => {
    const tasks = [
      task("1", "Parent"),
      task("2", "Child A", "1"),
      task("3", "Child B", "1"),
    ]
    const tree = buildTree(tasks)

    expect(tree).toHaveLength(1)
    expect(tree[0].id).toBe("1")
    expect(tree[0].children).toHaveLength(2)
    expect(tree[0].children[0].id).toBe("2")
    expect(tree[0].children[1].id).toBe("3")
  })

  it("handles multi-level nesting", () => {
    const tasks = [
      task("1", "Root"),
      task("2", "Child", "1"),
      task("3", "Grandchild", "2"),
    ]
    const tree = buildTree(tasks)

    expect(tree).toHaveLength(1)
    expect(tree[0].children[0].children[0].id).toBe("3")
  })

  it("promotes orphans to roots (parent not in set)", () => {
    const tasks = [
      task("2", "Orphan", "999"),
      task("3", "Root"),
    ]
    const tree = buildTree(tasks)

    expect(tree).toHaveLength(2)
    expect(tree.map((n) => n.id).sort()).toEqual(["2", "3"])
  })

  it("extracts status from task", () => {
    const t: ClickUpTask = {
      id: "1",
      name: "Test",
      parent: null,
      status: { status: "in progress" },
    }
    const tree = buildTree([t])
    expect(tree[0].status).toBe("in progress")
  })

  it("handles missing status gracefully", () => {
    const t = { id: "1", name: "Test", parent: null } as ClickUpTask
    const tree = buildTree([t])
    expect(tree[0].status).toBe("unknown")
  })
})
