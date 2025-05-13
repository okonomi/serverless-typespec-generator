import { describe, it, expect } from "vitest"
import { formatTypeSpec } from "@typespec/compiler"
import dedent from "dedent"

import type { ModelIR, OperationIR, TypeSpecIR } from "./type"
import { emitModel, emitOperation, emitTypeSpec } from "./emit"

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
      name: "TestModel",
      props: {
        id: { type: "string", required: true },
        age: { type: "numeric", required: false },
      },
    }
    const result = emitTypeSpec(ir)
    expect(await normalizeTypeSpec(result)).toBe(dedent`
      model TestModel {
        id: string;
        age?: numeric;
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
  it("should emit a simple operation", async () => {
    const ir: TypeSpecIR = {
      kind: "operation",
      operation: {
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
      },
    }
    const result = emitTypeSpec(ir)
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

describe("emitOperation", () => {
  it("should emit a simple operation", async () => {
    const operation: OperationIR = {
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
    const result = emitOperation(operation)
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
  it("should emit an operation with no request body", async () => {
    const operation: OperationIR = {
      name: "getUser",
      method: "get",
      route: "/users/{id}",
      returnType: {
        id: { type: "string", required: true },
        name: { type: "string", required: true },
        email: { type: "string", required: true },
      },
    }
    const result = emitOperation(operation)
    expect(await normalizeTypeSpec(result)).toBe(dedent`
      @route("/users/{id}")
      @get
      op getUser(): {
        id: string;
        name: string;
        email: string;
      };
    `)
  })
  it("should emit an operation with array response", async () => {
    const operation: OperationIR = {
      name: "getUsers",
      method: "get",
      route: "/users",
      returnType: [
        {
          id: { type: "string", required: true },
          name: { type: "string", required: true },
          email: { type: "string", required: true },
        },
      ],
    }
    const result = emitOperation(operation)
    expect(await normalizeTypeSpec(result)).toBe(dedent`
      @route("/users")
      @get
      op getUsers(): {
        id: string;
        name: string;
        email: string;
      }[];
    `)
  })
  it("should emit an operation with external model", async () => {
    const operation: OperationIR = {
      name: "getUser",
      method: "get",
      route: "/users/{id}",
      returnType: {
        ref: "User",
      },
    }
    const result = emitOperation(operation)
    expect(await normalizeTypeSpec(result)).toBe(dedent`
      @route("/users/{id}")
      @get
      op getUser(): User;
    `)
  })
  it("should emit an operation with union model", async () => {
    const operation: OperationIR = {
      name: "getUser",
      method: "get",
      route: "/users/{id}",
      returnType: {
        union: [
          {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            email: { type: "string", required: true },
          },
          {
            code: { type: "string", required: true },
            message: { type: "string", required: true },
          },
        ],
      },
    }
    const result = emitOperation(operation)
    expect(await normalizeTypeSpec(result)).toBe(dedent`
      @route("/users/{id}")
      @get
      op getUser(): {
        id: string;
        name: string;
        email: string;
      } | {
        code: string;
        message: string;
      };
    `)
  })
  it("should emit an operation with http response", async () => {
    const operation: OperationIR = {
      name: "getUser",
      method: "get",
      route: "/users/{id}",
      returnType: {
        statusCode: 200,
        body: {
          id: { type: "string", required: true },
          name: { type: "string", required: true },
          email: { type: "string", required: true },
        },
      },
    }
    const result = emitOperation(operation)
    expect(await normalizeTypeSpec(result)).toBe(dedent`
      @route("/users/{id}")
      @get
      op getUser(): {
        @statusCode statusCode: 200;
        @body body: {
          id: string;
          name: string;
          email: string;
        };
      };
    `)
  })
  it("should emit an operation with http response with array", async () => {
    const operation: OperationIR = {
      name: "getUsers",
      method: "get",
      route: "/users",
      returnType: {
        statusCode: 200,
        body: [
          {
            id: { type: "string", required: true },
            name: { type: "string", required: true },
            email: { type: "string", required: true },
          },
        ],
      },
    }
    const result = emitOperation(operation)
    expect(await normalizeTypeSpec(result)).toBe(dedent`
      @route("/users")
      @get
      op getUsers(): {
        @statusCode statusCode: 200;
        @body body: {
          id: string;
          name: string;
          email: string;
        }[];
      };
    `)
  })
  it("should emit an operation with path parameters", async () => {
    const operation: OperationIR = {
      name: "getUser",
      method: "get",
      route: "/users/{id}",
      parameters: {
        id: { type: "string", required: true },
      },
      returnType: { ref: "User" },
      http: {
        params: ["id"],
      },
    }
    const result = emitOperation(operation)
    expect(await normalizeTypeSpec(result)).toBe(dedent`
      @route("/users/{id}")
      @get
      op getUser(@path id: string): User;
    `)
  })
})
