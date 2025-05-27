import dedent from "dedent"
import { describe, expect, it } from "vitest"
import { normalizeTypeSpec } from "~/test/helper"
import {
  emitAlias,
  emitIR,
  emitModel,
  emitOperation,
  emitTypeSpec,
} from "./emit"
import type { TypeSpecIR, TypeSpecModelIR, TypeSpecOperationIR } from "./type"

const context = describe

describe("emitTypeSpec", () => {
  it("should generate TypeSpec definitions for given operations and models", async () => {
    const irList: TypeSpecIR[] = [
      {
        kind: "operation",
        name: "createUser",
        method: "post",
        route: "/users",
        requestBody: {
          type: { __ref: "CreateUserRequest" },
          required: true,
        },
        returnType: [
          {
            statusCode: 201,
            body: { __ref: "CreateUserResponse" },
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
      op createUser(
        @body
        body: CreateUserRequest,
      ): {
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
          type: {
            name: { type: "string", required: true },
            email: { type: "string", required: true },
          },
          required: true,
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
          @body
          body: {
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
  context("should emit an alias", () => {
    it("for an array", async () => {
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
    it("with model and field's description", async () => {
      const ir: TypeSpecIR = {
        kind: "alias",
        name: "Users",
        type: [
          {
            id: { type: "string", required: true, description: "User ID" },
            email: {
              type: "string",
              required: true,
              description: "User email",
            },
          },
        ],
      }
      const result = emitAlias(ir)
      expect(await normalizeTypeSpec(result)).toBe(dedent`
        alias Users = {
          @doc("""
            User ID
            """)
          id: string;

          @doc("""
            User email
            """)
          email: string;
        }[];
      `)
    })
  })
})

describe("emitModel", () => {
  context("should emit a model", () => {
    it("with simple model", async () => {
      const model: TypeSpecModelIR = {
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
      const model: TypeSpecModelIR = {
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
      const model: TypeSpecModelIR = {
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
      const model: TypeSpecModelIR = {
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
    it("with field's description", async () => {
      const model: TypeSpecModelIR = {
        kind: "model",
        name: "TestModel",
        props: {
          id: {
            type: "string",
            required: true,
            description: "User ID",
          },
          age: {
            type: "numeric",
            required: false,
            description: "User age",
          },
        },
      }
      const result = emitModel(model)
      expect(await normalizeTypeSpec(result)).toBe(dedent`
      model TestModel {
        @doc("""
          User ID
          """)
        id: string;

        @doc("""
          User age
          """)
        age?: numeric;
      }
    `)
    })
    it("with format type", async () => {
      const model: TypeSpecModelIR = {
        kind: "model",
        name: "DateModel",
        props: {
          createdAt: {
            type: { __format: "date-time", type: "string" },
            required: true,
          },
        },
      }
      const result = emitModel(model)
      expect(await normalizeTypeSpec(result)).toBe(dedent`
        model DateModel {
          @format("date-time")
          createdAt: string;
        }
      `)
    })
    it("with oneOf and format type", async () => {
      const model: TypeSpecModelIR = {
        kind: "model",
        name: "UserModel",
        props: {
          id: { type: "string", required: true },
          email: {
            type: {
              __union: [{ __format: "email", type: "string" }, "null"],
            },
            required: true,
          },
        },
      }
      const result = emitModel(model)
      expect(await normalizeTypeSpec(result)).toBe(dedent`
        model UserModel {
          id: string;

          @format("email")
          email: string | null;
        }
      `)
    })
  })
})

describe("emitOperation", () => {
  context("should emit an operation", () => {
    it("with simple operation", async () => {
      const operation: TypeSpecOperationIR = {
        kind: "operation",
        name: "createUser",
        method: "post",
        route: "/users",
        requestBody: {
          type: {
            name: { type: "string", required: true },
            email: { type: "string", required: true },
          },
          required: true,
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
        @body
        body: {
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
      const operation: TypeSpecOperationIR = {
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
      const operation: TypeSpecOperationIR = {
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
      const operation: TypeSpecOperationIR = {
        kind: "operation",
        name: "getUser",
        method: "get",
        route: "/users/{id}",
        returnType: {
          __ref: "User",
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
      const operation: TypeSpecOperationIR = {
        kind: "operation",
        name: "getUser",
        method: "get",
        route: "/users/{id}",
        returnType: {
          __union: [
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
      const operation: TypeSpecOperationIR = {
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
      const operation: TypeSpecOperationIR = {
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
      const operation: TypeSpecOperationIR = {
        kind: "operation",
        name: "getUser",
        method: "get",
        route: "/users/{id}",
        parameters: {
          id: { type: "string", required: true },
        },
        returnType: { __ref: "User" },
        http: {
          params: ["id"],
        },
      }
      const result = emitOperation(operation)
      expect(await normalizeTypeSpec(result)).toBe(dedent`
        @route("/users/{id}")
        @get
        op getUser(
          @path
          id: string,
        ): User;
      `)
    })
    it("with summary", async () => {
      const operation: TypeSpecOperationIR = {
        kind: "operation",
        name: "hello",
        summary: "Say hello",
        method: "get",
        route: "/hello",
        returnType: {
          message: { type: "string", required: true },
        },
      }
      const result = emitOperation(operation)
      expect(await normalizeTypeSpec(result)).toBe(dedent`
        @summary("Say hello")
        @route("/hello")
        @get
        op hello(): {
          message: string;
        };
      `)
    })
    it("with description", async () => {
      const operation: TypeSpecOperationIR = {
        kind: "operation",
        name: "hello",
        description: "Say hello",
        method: "get",
        route: "/hello",
        returnType: {
          message: { type: "string", required: true },
        },
      }
      const result = emitOperation(operation)
      expect(await normalizeTypeSpec(result)).toBe(dedent`
        @doc("""
          Say hello
          """)
        @route("/hello")
        @get
        op hello(): {
          message: string;
        };
      `)
    })
    it("with request body description", async () => {
      const operation: TypeSpecOperationIR = {
        kind: "operation",
        name: "createUser",
        method: "post",
        route: "/users",
        requestBody: {
          type: {
            name: { type: "string", required: true },
            email: { type: "string", required: true },
          },
          required: true,
          description: "Create a new user",
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
          @doc("""
            Create a new user
            """)
          @body
          body: {
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
    it("with path parameters description", async () => {
      const operation: TypeSpecOperationIR = {
        kind: "operation",
        name: "getUser",
        method: "get",
        route: "/users/{id}",
        parameters: {
          id: { type: "string", required: true, description: "User ID" },
        },
        returnType: { __ref: "User" },
        http: {
          params: ["id"],
        },
      }
      const result = emitOperation(operation)
      expect(await normalizeTypeSpec(result)).toBe(dedent`
        @route("/users/{id}")
        @get
        op getUser(
          @doc("""
            User ID
            """)
          @path
          id: string,
        ): User;
      `)
    })
  })
})
