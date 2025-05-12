import { describe, it, expect } from "vitest"
import { isArrayType, isObjectType, isPrimitiveType, isRefType } from "./type"

describe("isPrimitiveType", () => {
  it("should return true for a primitive type", () => {
    const result = isPrimitiveType("string")
    expect(result).toBe(true)
  })
  it("should return false for a non-primitive type", () => {
    const result = isPrimitiveType({ ref: "Test" })
    expect(result).toBe(false)
  })
})

describe("ifRefType", () => {
  it("should return true for a reference type", () => {
    const result = isRefType({ ref: "Test" })
    expect(result).toBe(true)
  })

  it("should return false for a non-reference type", () => {
    const result = isRefType("string")
    expect(result).toBe(false)
  })
})

describe("isObjectType", () => {
  it("should return true for an object type", () => {
    const result = isObjectType({})
    expect(result).toBe(true)
  })

  it("should return false for a non-object type", () => {
    const result = isObjectType("string")
    expect(result).toBe(false)
  })
})

describe("isArrayType", () => {
  it("should return true for an array type", () => {
    const result = isArrayType(["string"])
    expect(result).toBe(true)
  })

  it("should return false for a non-array type", () => {
    const result = isArrayType("string")
    expect(result).toBe(false)
  })
})
