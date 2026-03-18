#!/usr/bin/env node

import { parseInput } from "./url.js"
import {
  discoverLists,
  fetchAllTasks,
  fetchTask,
  fetchTeamId,
  resolveCustomTaskId,
} from "./clickup.js"
import { buildTree } from "./tree.js"
import { exportToDir } from "./export.js"
import type { ClickUpTask } from "./types.js"

function die(msg: string): never {
  console.error(msg)
  return process.exit(1) as never
}

async function resolveTeamId(hint: string | null, token: string): Promise<string> {
  if (hint) return hint
  console.error("Resolving team ID...")
  const id = await fetchTeamId(token)
  if (!id) die("Failed to resolve team ID from API")
  return id
}

async function main() {
  const input = process.argv[2]
  const outputDir = process.argv[3] ?? "clickup-export"

  if (!input) {
    die(
      "Usage: clickup-export <input> [output-dir]\n\n" +
      "  <input> can be:\n" +
      "    - A ClickUp URL (view or task permalink)\n" +
      "    - A custom task ID (e.g. BIG4-86)\n" +
      "    - A raw API list/space ID",
    )
  }

  const token = process.env.CLICKUP_API_TOKEN
  if (!token) {
    die("Error: CLICKUP_API_TOKEN environment variable not set")
  }

  const parsed = parseInput(input)
  let tasks: ClickUpTask[] = []

  if (parsed.kind === "custom-task-id") {
    // Custom task ID like BIG4-86 — resolve to real task, export its list
    const teamId = await resolveTeamId(parsed.teamId, token)
    console.error(`Resolving custom task ID: ${parsed.taskId}`)
    const result = await resolveCustomTaskId(parsed.taskId!, teamId, token)
    if (!result.ok) {
      die(`Failed to resolve ${parsed.taskId}: ${result.status} ${result.error}`)
    }
    const task = result.data
    const listId = (task as Record<string, unknown> & { list?: { id: string } }).list?.id
    if (listId) {
      console.error(`Resolved to task "${task.name}" in list ${listId}`)
      console.error(`Fetching all tasks from list: ${listId}`)
      tasks = await fetchAllTasks(listId, token)
    } else {
      console.error(`Resolved to task "${task.name}" (no list context, exporting single task)`)
      tasks = [task]
    }
  } else if (parsed.taskId) {
    // Task permalink URL or direct task ID
    console.error(`Fetching task: ${parsed.taskId}`)
    const result = await fetchTask(parsed.taskId, token)
    if (!result.ok) {
      die(`Failed to fetch task ${parsed.taskId}: ${result.status} ${result.error}`)
    }
    const task = result.data
    const listId = (task as Record<string, unknown> & { list?: { id: string } }).list?.id
    if (listId) {
      console.error(`Task "${task.name}" is in list ${listId}, fetching full list`)
      tasks = await fetchAllTasks(listId, token)
    } else {
      tasks = [task]
    }
  } else if (parsed.spaceId) {
    // View URL with space ID — discover all lists
    console.error(`Discovering lists in space: ${parsed.spaceId}`)
    const lists = await discoverLists(parsed.spaceId, token)
    console.error(`Found ${lists.length} lists`)
    for (const list of lists) {
      console.error(`  Fetching: ${list.name} (${list.id})`)
      const listTasks = await fetchAllTasks(list.id, token)
      console.error(`    ${listTasks.length} tasks`)
      tasks.push(...listTasks)
    }
  } else {
    die("Could not determine what to export from input: " + input)
  }

  console.error(`\nTotal: ${tasks.length} tasks`)

  const tree = buildTree(tasks)
  await exportToDir(tree, tasks, outputDir)

  console.error(`Tree written to: ${outputDir}/tree.json`)
  console.error(`Wrote ${tasks.length} task files to: ${outputDir}/tasks/`)
  console.error(`\nExport complete: ${outputDir}/`)
}

main().catch((err) => {
  console.error(`Error: ${err.message}`)
  process.exit(1)
})
