import dedent from "dedent"
import { describe, expect, it } from "vitest"
import { normalizeTypeSpec } from "../../test/helper"
import {
  emitAlias,
  emitIR,
  emitModel,
  emitOperation,
  emitTypeSpec,
} from "./emit"
import type { ModelIR, OperationIR, TypeSpecIR } from "./type"

const context = describe

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
  context("should emit TypeSpec IR", () => {
    it("with simple model", async () => {
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
    it("with simple operation", async () => {
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
  context("should emit a model", () => {
    it("with simple model", async () => {
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
    it("with array properties", async () => {
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
    it("with object properties", async () => {
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
    it("with mixed properties", async () => {
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
})

describe("emitOperation", () => {
  context("should emit an operation", () => {
    it("with simple operation", async () => {
      const operation: OperationIR = {
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
    it("with no request body", async () => {
      const operation: OperationIR = {
        kind: "operation",
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
    it("with array response", async () => {
      const operation: OperationIR = {
        kind: "operation",
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
    it("with external model", async () => {
      const operation: OperationIR = {
        kind: "operation",
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
    it("with union model", async () => {
      const operation: OperationIR = {
        kind: "operation",
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
    it("with http response", async () => {
      const operation: OperationIR = {
        kind: "operation",
        name: "getUser",
        method: "get",
        route: "/users/{id}",
        returnType: [
          {
            statusCode: 200,
            body: {
              id: { type: "string", required: true },
              name: { type: "string", required: true },
              email: { type: "string", required: true },
            },
          },
        ],
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
    it("with http response with array", async () => {
      const operation: OperationIR = {
        kind: "operation",
        name: "getUsers",
        method: "get",
        route: "/users",
        returnType: [
          {
            statusCode: 200,
            body: [
              {
                id: { type: "string", required: true },
                name: { type: "string", required: true },
                email: { type: "string", required: true },
              },
            ],
          },
        ],
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
    it("with path parameters", async () => {
      const operation: OperationIR = {
        kind: "operation",
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
})
