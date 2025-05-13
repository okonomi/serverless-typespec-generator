import { describe, it, expect } from "vitest"

import type { JSONSchema } from "./type"
import { jsonSchemaToModelIR, jsonSchemaToTypeSpecIR } from "./convert"

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
    expect(result).toEqual({
      kind: "model",
      model: {
        name: "Model",
        props: {
          id: { type: "string", required: true },
          age: { type: "int32", required: false },
        },
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
    expect(result).toEqual({
      name: "Model",
      props: {
        id: { type: "string", required: true },
        age: { type: "int32", required: false },
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
    expect(result).toEqual({
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
    expect(result).toEqual({
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
