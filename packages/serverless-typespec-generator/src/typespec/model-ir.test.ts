import { describe, it, expect } from "vitest"
import {
  type TypeSpecIR,
  type ModelIR,
  type JSONSchema,
  jsonSchemaToTypeSpecIR,
  jsonSchemaToModelIR,
  emitTypeSpec,
  emitModel,
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
    const typeSpecIR = jsonSchemaToTypeSpecIR(schema, "Model")
    expect(typeSpecIR).toEqual({
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
      "items": { type: "string" },
    }
    const typeSpecIR = jsonSchemaToTypeSpecIR(schema, "Tags")
    expect(typeSpecIR).toEqual({
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
    const ir: TypeSpecIR = {
      kind: "model",
      model: {
        name: "TestModel",
        props: {
          id: { type: "string", required: true },
          age: { type: "int32", required: false },
        },
      }
    }
    const result = emitTypeSpec(ir)
    expect(await normalizeTypeSpec(result)).toBe(dedent`
      model TestModel {
        id: string;
        age?: int32;
      }
    `)
  })
  it("should emit a alias for an array", async () => {
    const ir: TypeSpecIR = {
      kind: "alias",
      name: "Tags",
      type: ["string"],
    }
    const result = emitTypeSpec(ir)
    expect(await normalizeTypeSpec(result)).toBe(dedent`
      alias Tags = string[];
    `)
  })
})

describe("emitModel", () => {
  it("should emit a simple model", async () => {
    const model: ModelIR = {
      name: "TestModel",
      props: {
        id: { type: "string", required: true },
        age: { type: "int32", required: false },
      },
    }
    const result = emitModel(model)
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
    const result = emitModel(model)
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
    const result = emitModel(model)
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
    const result = emitModel(model)
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
