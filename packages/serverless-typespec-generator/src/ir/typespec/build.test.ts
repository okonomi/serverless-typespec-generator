import { describe, expect, it } from "vitest"
import type { JSONSchema } from "~/types/json-schema"
import { convertType, jsonSchemaToTypeSpecIR } from "./build"
import type { PropTypeIR, TypeSpecIR } from "./type"

const context = describe

describe("jsonSchemaToTypeSpecIR", () => {
  context("should convert JSON Schema", () => {
    it("with simplified schema to IR", () => {
      const schema: JSONSchema = {
        type: "object",
        properties: {
          id: { type: "string" },
          age: { type: "integer" },
        },
        required: ["id"],
      }
      const result = jsonSchemaToTypeSpecIR(schema, "Model")
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "model",
        name: "Model",
        props: {
          id: { type: "string", required: true },
          age: { type: "numeric", required: false },
        },
      })
    })
    it("of array to IR", () => {
      const schema: JSONSchema = {
        type: "array",
        items: { type: "string" },
      }
      const result = jsonSchemaToTypeSpecIR(schema, "Tags")
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "alias",
        name: "Tags",
        type: ["string"],
      })
    })
    it("with allOf to IR", () => {
      const schema: JSONSchema = {
        allOf: [
          {
            type: "object",
            properties: {
              id: { type: "string" },
            },
            required: ["id"],
          },
          {
            type: "object",
            properties: {
              age: { type: "integer" },
            },
            required: ["age"],
          },
        ],
      }
      const result = jsonSchemaToTypeSpecIR(schema, "Model")
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "model",
        name: "Model",
        props: {
          id: { type: "string", required: true },
          age: { type: "numeric", required: true },
        },
      })
    })
    it("with allOf and required to IR", () => {
      const schema: JSONSchema = {
        type: "object",
        allOf: [
          {
            type: "object",
            properties: {
              id: { type: "string" },
            },
          },
          {
            type: "object",
            properties: {
              age: { type: "integer" },
            },
          },
          {
            type: "object",
            required: ["id", "age"],
          },
        ],
      }
      const result = jsonSchemaToTypeSpecIR(schema, "Model")
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "model",
        name: "Model",
        props: {
          id: { type: "string", required: true },
          age: { type: "numeric", required: true },
        },
      })
    })
    it("with array properties to IR", () => {
      const schema: JSONSchema = {
        type: "object",
        properties: {
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["tags"],
      }
      const result = jsonSchemaToTypeSpecIR(schema, "ArrayModel")
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "model",
        name: "ArrayModel",
        props: {
          tags: { type: ["string"], required: true },
        },
      })
    })
    it("with nested object properties to IR", () => {
      const schema: JSONSchema = {
        type: "object",
        properties: {
          meta: {
            type: "object",
            properties: {
              name: { type: "string" },
            },
            required: ["name"],
          },
        },
        required: ["meta"],
      }
      const result = jsonSchemaToTypeSpecIR(schema, "ObjectModel")
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "model",
        name: "ObjectModel",
        props: {
          meta: {
            type: {
              name: { type: "string", required: true },
            },
            required: true,
          },
        },
      })
    })
  })
})

describe("convertType", () => {
  it("should convert string type to string", () => {
    const schema: JSONSchema = { type: "string" }
    const result = convertType(schema)
    expect(result).toBe("string")
  })
  it("should convert integer type to numeric", () => {
    const schema: JSONSchema = { type: "integer" }
    const result = convertType(schema)
    expect(result).toBe("numeric")
  })
  it("should convert number type to numeric", () => {
    const schema: JSONSchema = { type: "number" }
    const result = convertType(schema)
    expect(result).toBe("numeric")
  })
  it("should convert boolean type to boolean", () => {
    const schema: JSONSchema = { type: "boolean" }
    const result = convertType(schema)
    expect(result).toBe("boolean")
  })
  it("should convert array type to array of string", () => {
    const schema: JSONSchema = { type: "array", items: { type: "string" } }
    const result = convertType(schema)
    expect(result).toStrictEqual(["string"])
  })
  it("should convert oneOf type to union of types", () => {
    const schema: JSONSchema = {
      oneOf: [{ type: "string" }, { type: "null" }],
    }
    const result = convertType(schema)
    expect(result).toStrictEqual<PropTypeIR>({ union: ["string", "null"] })
  })
})
