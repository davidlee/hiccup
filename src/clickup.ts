import type { ApiResult, ClickUpTask } from "./types.js"

const BASE = "https://api.clickup.com/api/v2"

export async function fetchClickUp<T>(
  path: string,
  token: string,
  params?: Record<string, string>,
): Promise<ApiResult<T>> {
  const url = new URL(`${BASE}${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: token },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    return { ok: false, status: res.status, error: body }
  }

  const data = (await res.json()) as T
  return { ok: true, data }
}

export async function fetchTeamId(
  token: string,
): Promise<string | null> {
  const result = await fetchClickUp<{ teams: { id: string }[] }>("/team", token)
  if (!result.ok) return null
  return result.data.teams[0]?.id ?? null
}

interface Folder {
  id: string
  name: string
  lists: { id: string; name: string }[]
}

interface SpaceLists {
  lists: { id: string; name: string }[]
}

export async function discoverLists(
  spaceId: string,
  token: string,
): Promise<{ id: string; name: string }[]> {
  const lists: { id: string; name: string }[] = []

  // Lists in folders
  const folders = await fetchClickUp<{ folders: Folder[] }>(
    `/space/${spaceId}/folder`,
    token,
  )
  if (folders.ok) {
    for (const folder of folders.data.folders) {
      for (const list of folder.lists) {
        lists.push({ id: list.id, name: `${folder.name} / ${list.name}` })
      }
    }
  } else {
    console.error(`[warn] Failed to fetch folders for space ${spaceId}: ${folders.status}`)
  }

  // Folderless lists
  const folderless = await fetchClickUp<SpaceLists>(
    `/space/${spaceId}/list`,
    token,
  )
  if (folderless.ok) {
    for (const list of folderless.data.lists) {
      lists.push({ id: list.id, name: list.name })
    }
  } else {
    console.error(`[warn] Failed to fetch folderless lists for space ${spaceId}: ${folderless.status}`)
  }

  return lists
}

export async function fetchAllTasks(
  listId: string,
  token: string,
): Promise<ClickUpTask[]> {
  const tasks: ClickUpTask[] = []
  let page = 0

  while (true) {
    const result = await fetchClickUp<{ tasks: ClickUpTask[] }>(
      `/list/${listId}/task`,
      token,
      {
        archived: "false",
        include_closed: "true",
        subtasks: "true",
        page: String(page),
      },
    )

    if (!result.ok) {
      console.error(`[warn] Failed to fetch page ${page} of list ${listId}: ${result.status} ${result.error}`)
      break
    }

    const batch = result.data.tasks
    if (batch.length === 0) break

    tasks.push(...batch)
    page++
  }

  return tasks
}

export async function fetchTask(
  taskId: string,
  token: string,
): Promise<ApiResult<ClickUpTask>> {
  return fetchClickUp<ClickUpTask>(`/task/${taskId}`, token)
}

export async function resolveCustomTaskId(
  customId: string,
  teamId: string,
  token: string,
): Promise<ApiResult<ClickUpTask>> {
  return fetchClickUp<ClickUpTask>(
    `/task/${customId}`,
    token,
    { custom_task_ids: "true", team_id: teamId },
  )
}
