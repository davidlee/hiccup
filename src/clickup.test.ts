import { describe, it, expect, vi, beforeEach } from "vitest"
import { fetchClickUp, fetchAllTasks } from "./clickup.js"

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  }
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe("fetchClickUp", () => {
  it("returns ok result on success", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ foo: "bar" }))

    const result = await fetchClickUp("/test", "token123")

    expect(result).toEqual({ ok: true, data: { foo: "bar" } })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v2/test"),
      expect.objectContaining({
        headers: { Authorization: "token123" },
      }),
    )
  })

  it("returns error result on non-2xx", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse("Forbidden", 403))

    const result = await fetchClickUp("/test", "token123")

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(403)
    }
  })

  it("appends query params", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}))

    await fetchClickUp("/test", "tok", { page: "2", archived: "false" })

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain("page=2")
    expect(calledUrl).toContain("archived=false")
  })
})

describe("fetchAllTasks", () => {
  it("paginates until empty page", async () => {
    const page0 = [{ id: "1", name: "A", parent: null, status: { status: "open" } }]
    const page1 = [{ id: "2", name: "B", parent: null, status: { status: "open" } }]

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ tasks: page0 }))
      .mockResolvedValueOnce(jsonResponse({ tasks: page1 }))
      .mockResolvedValueOnce(jsonResponse({ tasks: [] }))

    const tasks = await fetchAllTasks("list-1", "tok")

    expect(tasks).toHaveLength(2)
    expect(tasks[0].id).toBe("1")
    expect(tasks[1].id).toBe("2")
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it("returns partial results on error", async () => {
    const page0 = [{ id: "1", name: "A", parent: null, status: { status: "open" } }]

    mockFetch
      .mockResolvedValueOnce(jsonResponse({ tasks: page0 }))
      .mockResolvedValueOnce(jsonResponse("Unauthorized", 401))

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const tasks = await fetchAllTasks("list-1", "tok")
    consoleSpy.mockRestore()

    expect(tasks).toHaveLength(1)
    expect(tasks[0].id).toBe("1")
  })
})
