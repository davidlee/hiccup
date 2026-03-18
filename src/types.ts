export interface ClickUpTask {
  id: string
  name: string
  parent: string | null
  status: { status: string }
  [key: string]: unknown
}

export interface TreeNode {
  id: string
  title: string
  status: string
  children: TreeNode[]
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string }
