import { describe, it, expect } from "vitest"
import { parseInput } from "./url.js"

describe("parseInput", () => {
  it("parses view URL with space ID", () => {
    const r = parseInput("https://app.clickup.com/69/v/l/25-119616?pr=90165360436")
    expect(r.kind).toBe("space-url")
    expect(r.spaceId).toBe("90165360436")
    expect(r.teamId).toBe("69")
  })

  it("parses task permalink with internal ID", () => {
    const r = parseInput("https://app.clickup.com/t/86d0mvp5m")
    expect(r.kind).toBe("task-url")
    expect(r.taskId).toBe("86d0mvp5m")
  })

  it("parses task detail URL with custom ID", () => {
    const r = parseInput("https://app.clickup.com/t/69/BIG4-86")
    expect(r.kind).toBe("custom-task-id")
    expect(r.teamId).toBe("69")
    expect(r.taskId).toBe("BIG4-86")
  })

  it("parses bare custom task ID", () => {
    const r = parseInput("BIG4-86")
    expect(r.kind).toBe("custom-task-id")
    expect(r.taskId).toBe("BIG4-86")
  })

  it("parses bare API ID", () => {
    const r = parseInput("901611598069")
    expect(r.kind).toBe("api-id")
    expect(r.taskId).toBe("901611598069")
  })

  it("handles view URL without pr param", () => {
    const r = parseInput("https://app.clickup.com/69/v/l/25-119616")
    expect(r.kind).toBe("space-url")
    expect(r.teamId).toBe("69")
    expect(r.spaceId).toBeNull()
  })
})
