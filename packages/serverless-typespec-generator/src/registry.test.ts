import { beforeEach, describe, expect, it } from "vitest"

import { Registry } from "./registry"

describe("Registry", () => {
  type TestType = { value: number }
  let registry: Registry<TestType>

  beforeEach(() => {
    registry = new Registry<TestType>()
  })

  describe("register", () => {
    it("registers a value", () => {
      registry.register("foo", { value: 1 })
      expect(registry.get("foo")).toStrictEqual({ value: 1 })
    })
    it("throws if registering duplicate key", () => {
      registry.register("foo", { value: 3 })
      expect(() => registry.register("foo", { value: 4 })).toThrow(
        'Registry already contains key "foo"',
      )
    })
  })

  describe("get", () => {
    it("returns the registered value", () => {
      registry.register("foo", { value: 1 })
      expect(registry.get("foo")).toStrictEqual({ value: 1 })
    })
    it("returns undefined for non-existent key", () => {
      expect(registry.get("bar")).toBeUndefined()
    })
  })

  describe("has", () => {
    it("returns true if key exists", () => {
      registry.register("foo", { value: 2 })
      expect(registry.has("foo")).toBe(true)
    })
    it("returns false if key does not exist", () => {
      expect(registry.has("bar")).toBe(false)
    })
  })

  describe("values", () => {
    it("returns all registered values as an iterator", () => {
      registry.register("foo", { value: 1 })
      registry.register("bar", { value: 2 })
      registry.register("baz", { value: 3 })
      const values = Array.from(registry.values())
      expect(values).toContainEqual({ value: 1 })
      expect(values).toContainEqual({ value: 2 })
      expect(values).toContainEqual({ value: 3 })
      expect(values).toHaveLength(3)
    })
    it("returns an empty iterator if nothing is registered", () => {
      expect(Array.from(registry.values())).toStrictEqual([])
    })
  })
})
