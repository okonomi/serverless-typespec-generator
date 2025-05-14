import { describe, expect, it } from "vitest"

import {
  convertType,
  jsonSchemaToModelIR,
  jsonSchemaToTypeSpecIR,
} from "./convert"
import type { JSONSchema, ModelIR, PropTypeIR } from "./type"

describe("jsonSchemaToTypeSpecIR", () => {
  it("should convert a simple JSON schema to TypeSpec IR", () => {
    const schema: JSONSchema = {
      type: "object",
      properties: {
        id: { type: "string" },
        age: { type: "integer" },
      },
      required: ["id"],
    }
    const result = jsonSchemaToTypeSpecIR(schema, "Model")
    expect(result).toEqual<ModelIR>({
      kind: "model",
      name: "Model",
      props: {
        id: { type: "string", required: true },
        age: { type: "numeric", required: false },
      },
    })
  })
  it("should convert a JSON schema of array to TypeSpec IR", () => {
    const schema: JSONSchema = {
      type: "array",
      items: { type: "string" },
    }
    const result = jsonSchemaToTypeSpecIR(schema, "Tags")
    expect(result).toEqual({
      kind: "alias",
      name: "Tags",
      type: ["string"],
    })
  })
  it("should convert a JSON schema with allOf to TypeSpec IR", () => {
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
    expect(result).toEqual<ModelIR>({
      kind: "model",
      name: "Model",
      props: {
        id: { type: "string", required: true },
        age: { type: "numeric", required: true },
      },
    })
  })
})

describe("jsonSchemaToModelIR", () => {
  it("should convert a simple JSON schema to ModelIR", () => {
    const schema: JSONSchema = {
      type: "object",
      properties: {
        id: { type: "string" },
        age: { type: "integer" },
      },
      required: ["id"],
    }
    const result = jsonSchemaToModelIR(schema, "Model")
    expect(result).toEqual<ModelIR>({
      kind: "model",
      name: "Model",
      props: {
        id: { type: "string", required: true },
        age: { type: "numeric", required: false },
      },
    })
  })
  it("should convert a JSON schema with array properties to ModelIR", () => {
    const schema: JSONSchema = {
      type: "object",
      properties: {
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["tags"],
    }
    const result = jsonSchemaToModelIR(schema, "ArrayModel")
    expect(result).toEqual<ModelIR>({
      kind: "model",
      name: "ArrayModel",
      props: {
        tags: { type: ["string"], required: true },
      },
    })
  })
  it("should convert a JSON schema with nested object properties to ModelIR", () => {
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
    const result = jsonSchemaToModelIR(schema, "ObjectModel")
    expect(result).toEqual<ModelIR>({
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
    expect(result).toEqual(["string"])
  })
  it("should convert oneOf type to union of types", () => {
    const schema: JSONSchema = {
      oneOf: [{ type: "string" }, { type: "integer" }],
    }
    const result = convertType(schema)
    expect(result).toEqual<PropTypeIR>({ union: ["string", "numeric"] })
  })
})
