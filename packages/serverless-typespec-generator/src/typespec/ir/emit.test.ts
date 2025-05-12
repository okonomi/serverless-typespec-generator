import { describe, it, expect } from "vitest"
import { formatTypeSpec } from "@typespec/compiler"
import dedent from "dedent"

import type { ModelIR, TypeSpecIR } from "./type"
import { emitModel, emitTypeSpec } from "./emit"

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
