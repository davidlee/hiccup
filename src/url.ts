export type InputKind = "space-url" | "task-url" | "custom-task-id" | "api-id"

export interface ParsedInput {
  kind: InputKind
  teamId: string | null
  spaceId: string | null
  taskId: string | null
}

export function parseInput(input: string): ParsedInput {
  if (input.startsWith("http")) {
    const url = new URL(input)

    // Task permalink: /t/{task_id} or /t/{team_id}/{CUSTOM-ID}
    const taskMatch = url.pathname.match(/^\/t\/(?:(\d+)\/)?(.+)/)
    if (taskMatch) {
      const teamId = taskMatch[1] ?? null
      const idPart = taskMatch[2]
      const isCustom = /^[A-Z][A-Z0-9]*-\d+$/i.test(idPart)
      return {
        kind: isCustom ? "custom-task-id" : "task-url",
        teamId,
        spaceId: null,
        taskId: idPart,
      }
    }

    // View URL: /69/v/l/25-119616?pr=90165360436
    const teamMatch = url.pathname.match(/^\/(\d+)\//)
    const teamId = teamMatch?.[1] ?? null
    const spaceId = url.searchParams.get("pr")

    return { kind: "space-url", teamId, spaceId, taskId: null }
  }

  // Custom task ID: PREFIX-123
  if (/^[A-Z][A-Z0-9]*-\d+$/i.test(input)) {
    return { kind: "custom-task-id", teamId: null, spaceId: null, taskId: input }
  }

  // Bare ID
  return { kind: "api-id", teamId: null, spaceId: null, taskId: input }
}
