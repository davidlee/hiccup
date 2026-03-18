import type { ClickUpTask, TreeNode } from "./types.js"

export function buildTree(tasks: ClickUpTask[]): TreeNode[] {
  const index = new Map<string, TreeNode>()
  const children = new Map<string, TreeNode[]>()

  for (const task of tasks) {
    const node: TreeNode = {
      id: task.id,
      title: task.name,
      status: task.status?.status ?? "unknown",
      children: [],
    }
    index.set(task.id, node)

    const parentId = task.parent
    if (parentId) {
      const siblings = children.get(parentId) ?? []
      siblings.push(node)
      children.set(parentId, siblings)
    }
  }

  // Attach children to parents
  for (const [parentId, kids] of children) {
    const parent = index.get(parentId)
    if (parent) {
      parent.children = kids
    }
  }

  // Roots: no parent, or parent not in the set (permission gap)
  return tasks
    .filter((t) => !t.parent || !index.has(t.parent))
    .map((t) => index.get(t.id)!)
}
