import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { ClickUpTask, TreeNode } from "./types.js"

export async function exportToDir(
  tree: TreeNode[],
  tasks: ClickUpTask[],
  outputDir: string,
): Promise<void> {
  const tasksDir = join(outputDir, "tasks")
  await mkdir(tasksDir, { recursive: true })

  await writeFile(
    join(outputDir, "tree.json"),
    JSON.stringify(tree, null, 2),
  )

  await Promise.all(
    tasks.map((task) =>
      writeFile(
        join(tasksDir, `${task.id}.json`),
        JSON.stringify(task, null, 2),
      ),
    ),
  )
}
