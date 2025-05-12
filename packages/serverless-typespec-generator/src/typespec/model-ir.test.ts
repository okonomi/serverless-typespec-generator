import { describe, it, expect } from "vitest"
import {
  type ModelIR,
  type JSONSchema,
  jsonSchemaToModelIR,
  emitTypeSpec,
} from "./model-ir"
import dedent from "dedent"
import { formatTypeSpec } from "@typespec/compiler"

async function normalizeTypeSpec(code: string) {
  const formattedCode = await formatTypeSpec(code, {
    indent: "  ",
    lineWidth: 80,
    trailingNewline: false,
  })
  return formattedCode.trimEnd()
}

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
    const modelIR = jsonSchemaToModelIR(schema, "Model")
    expect(modelIR).toEqual({
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
    const modelIR = jsonSchemaToModelIR(schema, "ArrayModel")
    expect(modelIR).toEqual({
      name: "ArrayModel",
      props: {
        tags: { type: ["string"], required: true }
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
    const modelIR = jsonSchemaToModelIR(schema, "ObjectModel")
    expect(modelIR).toEqual({
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

describe("emitTypeSpec", () => {
  it("should emit a simple model", async () => {
    const model: ModelIR = {
      name: "TestModel",
      props: {
        id: { type: "string", required: true },
        age: { type: "int32", required: false },
      },
    }
    const result = emitTypeSpec(model)
    expect(await normalizeTypeSpec(result)).toBe(dedent`
      model TestModel {
        id: string;
        age?: int32;
      }
    `)
  })
  it("should emit a model with array properties", async () => {
    const model: ModelIR = {
      name: "ArrayModel",
      props: {
        tags: { type: ["string"], required: true },
      },
    }
    const result = emitTypeSpec(model)
    expect(await normalizeTypeSpec(result)).toBe(dedent`
      model ArrayModel {
        tags: string[];
      }
    `)
  })
  it("should emit a model with object properties", async () => {
    const model: ModelIR = {
      name: "ObjectModel",
      props: {
        meta: {
          type: {
            name: { type: "string", required: true },
          },
          required: true,
        },
      },
    }
    const result = emitTypeSpec(model)
    expect(await normalizeTypeSpec(result)).toBe(dedent`
      model ObjectModel {
        meta: {
          name: string;
        };
      }
    `)
  })
  it("should emit a model with mixed properties", async () => {
    const model: ModelIR = {
      name: "MixedModel",
      props: {
        active: { type: "boolean", required: true },
        tags: { type: ["string"], required: false },
        meta: {
          type: {
            name: { type: "string", required: true },
          },
          required: false,
        },
      },
    }
    const result = emitTypeSpec(model)
    expect(await normalizeTypeSpec(result)).toBe(dedent`
      model MixedModel {
        active: boolean;
        tags?: string[];
        meta?: {
          name: string;
        };
      }
    `)
  })
})
