import { describe, expect, it } from "vitest"

import {
  isArrayType,
  isFormatType,
  isHttpResponse,
  isHttpResponses,
  isLiteralType,
  isPatternType,
  isPrimitiveType,
  isPropsType,
  isRefType,
  isUnionType,
} from "./type"

describe("isHttpResponse", () => {
  it("should return true for a valid HTTP response", () => {
    const result = isHttpResponse({
      statusCode: 200,
      body: {
        name: { type: "string", required: true },
        email: { type: "string", required: true },
      },
    })
    expect(result).toBe(true)
  })
  it("should return false for an invalid HTTP response", () => {
    const result = isHttpResponse("string")
    expect(result).toBe(false)
  })
})

describe("isHttpResponses", () => {
  it("should return true for an array of HTTP responses", () => {
    const result = isHttpResponses([
      {
        statusCode: 200,
        body: {
          name: { type: "string", required: true },
          email: { type: "string", required: true },
        },
      },
    ])
    expect(result).toBe(true)
  })
  it("should return false for a non-array type", () => {
    const result = isHttpResponses("string")
    expect(result).toBe(false)
  })
})

describe("isPrimitiveType", () => {
  it("should return true for a primitive type", () => {
    const result = isPrimitiveType("string")
    expect(result).toBe(true)
  })
  it("should return false for a non-primitive type", () => {
    const result = isPrimitiveType({ __ref: "Test" })
    expect(result).toBe(false)
  })
  it("should return true for a null type", () => {
    const result = isPrimitiveType("null")
    expect(result).toBe(true)
  })
})

describe("isLiteralType", () => {
  it("should return true for a literal type", () => {
    expect(isLiteralType({ __literal: "test" })).toBe(true)
    expect(isLiteralType({ __literal: 123 })).toBe(true)
    expect(isLiteralType({ __literal: true })).toBe(true)
  })
  it("should return false for a non-literal type", () => {
    expect(isLiteralType("string")).toBe(false)
    expect(isLiteralType({})).toBe(false)
    expect(isLiteralType([])).toBe(false)
    expect(isLiteralType(null)).toBe(false)
    expect(isLiteralType(undefined)).toBe(false)
    expect(isLiteralType("null")).toBe(false)
  })
})

describe("isRefType", () => {
  it("should return true for a reference type", () => {
    const result = isRefType({ __ref: "Test" })
    expect(result).toBe(true)
  })

  it("should return false for a non-reference type", () => {
    const result = isRefType("string")
    expect(result).toBe(false)
  })
})

describe("isUnionType", () => {
  it("should return true for a union type", () => {
    const result = isUnionType({ __union: ["string", "numeric"] })
    expect(result).toBe(true)
  })

  it("should return false for a non-union type", () => {
    const result = isUnionType("string")
    expect(result).toBe(false)
  })
})

describe("isFormatType", () => {
  it("should return true for a format type", () => {
    const result = isFormatType({ __format: "date-time", type: "string" })
    expect(result).toBe(true)
  })
  it("should return false for a non-format type", () => {
    const result = isFormatType("string")
    expect(result).toBe(false)
  })
})

describe("isPatternType", () => {
  it("should return true for a pattern type", () => {
    const result = isPatternType({ __pattern: "^[a-z]+$", type: "string" })
    expect(result).toBe(true)
  })
  it("should return false for a non-pattern type", () => {
    const result = isPatternType("string")
    expect(result).toBe(false)
  })
})

describe("isPropsType", () => {
  it("should return true for a props type", () => {
    const result = isPropsType({})
    expect(result).toBe(true)
  })

  it("should return false for a non-props type", () => {
    const result = isPropsType("string")
    expect(result).toBe(false)
  })

  it("should return false for a array type", () => {
    const result = isPropsType([])
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
