import { describe, expect, it } from "vitest"

import { formatTypeSpec } from "@typespec/compiler"
import dedent from "dedent"
import type { ModelIR, TypeSpecIR } from "./../typespec/ir/type"
import { emitAlias, emitIR, emitModel, emitTypeSpec } from "./emit"

async function normalizeTypeSpec(code: string) {
  const formattedCode = await formatTypeSpec(code, {
    indent: "  ",
    lineWidth: 80,
    trailingNewline: false,
  })
  return formattedCode.trimEnd()
}

describe("emitTypeSpec", () => {
  it("should generate TypeSpec definitions for given operations and models", async () => {
    const irList: TypeSpecIR[] = [
      {
        kind: "operation",
        name: "createUser",
        method: "post",
        route: "/users",
        requestBody: { ref: "CreateUserRequest" },
        returnType: [
          {
            statusCode: 201,
            body: { ref: "CreateUserResponse" },
          },
        ],
      },
      {
        kind: "model",
        name: "CreateUserRequest",
        props: {
          name: { type: "string", required: true },
          email: { type: "string", required: true },
        },
      },
      {
        kind: "model",
        name: "CreateUserResponse",
        props: {
          id: { type: "string", required: true },
        },
      },
    ]
    const result = emitTypeSpec(irList)

    const expected = dedent`
      import "@typespec/http";

      using Http;

      @service(#{ title: "Generated API" })
      namespace GeneratedApi;

      @route("/users")
      @post
      op createUser(@body body: CreateUserRequest): {
        @statusCode statusCode: 201;
        @body body: CreateUserResponse;
      };

      model CreateUserRequest {
        name: string;
        email: string;
      }

      model CreateUserResponse {
        id: string;
      }
    `

    expect(await normalizeTypeSpec(result)).toBe(expected)
  })
})

describe("emitIR", () => {
  it("should emit a simple model", async () => {
    const ir: TypeSpecIR = {
      kind: "model",
      name: "TestModel",
      props: {
        id: { type: "string", required: true },
        age: { type: "numeric", required: false },
      },
    }
    const result = emitIR(ir)
    expect(await normalizeTypeSpec(result)).toBe(dedent`
      model TestModel {
        id: string;
        age?: numeric;
      }
    `)
  })
  it("should emit a simple operation", async () => {
    const ir: TypeSpecIR = {
      kind: "operation",
      name: "createUser",
      method: "post",
      route: "/users",
      requestBody: {
        name: { type: "string", required: true },
        email: { type: "string", required: true },
      },
      returnType: {
        id: { type: "string", required: true },
        name: { type: "string", required: true },
        email: { type: "string", required: true },
      },
    }
    const result = emitIR(ir)
    expect(await normalizeTypeSpec(result)).toBe(dedent`
      @route("/users")
      @post
      op createUser(
        @body body: {
          name: string;
          email: string;
        },
      ): {
        id: string;
        name: string;
        email: string;
      };
    `)
  })
})

describe("emitAlias", () => {
  it("should emit a alias for an array", async () => {
    const ir: TypeSpecIR = {
      kind: "alias",
      name: "Tags",
      type: ["string"],
    }
    const result = emitAlias(ir)
    expect(await normalizeTypeSpec(result)).toBe(dedent`
      alias Tags = string[];
    `)
  })
})

describe("emitModel", () => {
  it("should emit a simple model", async () => {
    const model: ModelIR = {
      kind: "model",
      name: "TestModel",
      props: {
        id: { type: "string", required: true },
        age: { type: "numeric", required: false },
      },
    }
    const result = emitModel(model)
    expect(await normalizeTypeSpec(result)).toBe(dedent`
      model TestModel {
        id: string;
        age?: numeric;
      }
    `)
  })
  it("should emit a model with array properties", async () => {
    const model: ModelIR = {
      kind: "model",
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
      kind: "model",
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
