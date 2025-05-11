import { describe, it, expect } from "vitest"
import { type ModelIR, emitTypeSpec } from "./model-ir"
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
        tags: { type: { array: "string" }, required: true },
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
            object: {
              name: { type: "string", required: true },
            },
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
        tags: { type: { array: "string" }, required: false },
        meta: {
          type: {
            object: {
              name: { type: "string", required: true },
            },
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
