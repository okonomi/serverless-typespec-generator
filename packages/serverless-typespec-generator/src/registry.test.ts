import { describe, it, expect, beforeEach } from "vitest"
import { Registry } from "./registry"

describe("Registry", () => {
  type TestType = { value: number }
  let registry: Registry<TestType>

  beforeEach(() => {
    registry = new Registry<TestType>()
  })

  it("registers and gets a value", () => {
    registry.register("foo", { value: 1 })
    expect(registry.get("foo")).toEqual({ value: 1 })
  })

  it("returns undefined for non-existent key", () => {
    expect(registry.get("bar")).toBeUndefined()
  })

  it("checks existence with has", () => {
    registry.register("foo", { value: 2 })
    expect(registry.has("foo")).toBe(true)
    expect(registry.has("bar")).toBe(false)
  })

  it("throws if registering duplicate key", () => {
    registry.register("foo", { value: 3 })
    expect(() => registry.register("foo", { value: 4 })).toThrow(
      'Registry already contains key "foo"',
    )
  })
})
