import { describe, expect, it } from "vitest"
import type {
  ServerlessFunctionIR,
  ServerlessIR,
  ServerlessModelIR,
} from "~/ir/serverless/type"
import { Registry } from "~/registry"
import type { JSONSchema } from "~/types/json-schema"
import {
  buildModelIR,
  buildOperationIR,
  buildTypeSpecIR,
  convertType,
} from "./build"
import type { PropTypeIR, TypeSpecIR, TypeSpecOperationIR } from "./type"

const context = describe

describe("buildModelIR", () => {
  context("should build Model IR", () => {
    it("with simplified schema to IR", () => {
      const model: ServerlessModelIR = {
        kind: "model",
        key: "model",
        name: "Model",
        schema: {
          type: "object",
          properties: {
            id: { type: "string" },
            age: { type: "integer" },
          },
          required: ["id"],
        },
      }
      const result = buildModelIR(model)
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "model",
        name: "Model",
        props: {
          id: { type: "string", required: true },
          age: { type: "numeric", required: false },
        },
      })
    })
    it("of array to IR", () => {
      const model: ServerlessModelIR = {
        kind: "model",
        key: "tags",
        name: "Tags",
        schema: {
          type: "array",
          items: { type: "string" },
        },
      }
      const result = buildModelIR(model)
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "alias",
        name: "Tags",
        type: ["string"],
      })
    })
    it("with allOf to IR", () => {
      const model: ServerlessModelIR = {
        kind: "model",
        key: "model",
        name: "Model",
        schema: {
          allOf: [
            {
              type: "object",
              properties: { id: { type: "string" } },
              required: ["id"],
            },
            {
              type: "object",
              properties: { age: { type: "integer" } },
              required: ["age"],
            },
          ],
        },
      }
      const result = buildModelIR(model)
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "model",
        name: "Model",
        props: {
          id: { type: "string", required: true },
          age: { type: "numeric", required: true },
        },
      })
    })
    it("with allOf and required to IR", () => {
      const model: ServerlessModelIR = {
        kind: "model",
        key: "model",
        name: "Model",
        schema: {
          allOf: [
            { type: "object", properties: { id: { type: "string" } } },
            { type: "object", properties: { age: { type: "integer" } } },
            { type: "object", required: ["id", "age"] },
          ],
        },
      }
      const result = buildModelIR(model)
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "model",
        name: "Model",
        props: {
          id: { type: "string", required: true },
          age: { type: "numeric", required: true },
        },
      })
    })
    it("with allOf and description to IR", () => {
      const model: ServerlessModelIR = {
        kind: "model",
        key: "model",
        name: "Model",
        schema: {
          allOf: [
            {
              type: "object",
              properties: { id: { type: "string", description: "User ID" } },
              required: ["id"],
            },
            {
              type: "object",
              properties: { age: { type: "integer", description: "User age" } },
              required: ["age"],
            },
          ],
        },
      }
      const result = buildModelIR(model)
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "model",
        name: "Model",
        props: {
          id: { type: "string", required: true, description: "User ID" },
          age: { type: "numeric", required: true, description: "User age" },
        },
      })
    })
    it("with array properties to IR", () => {
      const model: ServerlessModelIR = {
        kind: "model",
        key: "arrayModel",
        name: "ArrayModel",
        schema: {
          type: "object",
          properties: {
            tags: { type: "array", items: { type: "string" } },
          },
          required: ["tags"],
        },
      }
      const result = buildModelIR(model)
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "model",
        name: "ArrayModel",
        props: {
          tags: { type: ["string"], required: true },
        },
      })
    })
    it("with nested object properties to IR", () => {
      const model: ServerlessModelIR = {
        kind: "model",
        key: "objectModel",
        name: "ObjectModel",
        schema: {
          type: "object",
          properties: {
            meta: {
              type: "object",
              properties: { name: { type: "string" } },
              required: ["name"],
            },
          },
          required: ["meta"],
        },
      }
      const result = buildModelIR(model)
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "model",
        name: "ObjectModel",
        props: {
          meta: {
            type: { name: { type: "string", required: true } },
            required: true,
          },
        },
      })
    })
    it("with description of properties to IR", () => {
      const model: ServerlessModelIR = {
        kind: "model",
        key: "model",
        name: "Model",
        schema: {
          type: "object",
          properties: {
            id: { type: "string", description: "User ID" },
            age: { type: "integer", description: "User age" },
          },
          required: ["id"],
        },
      }
      const result = buildModelIR(model)
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "model",
        name: "Model",
        props: {
          id: { type: "string", required: true, description: "User ID" },
          age: { type: "numeric", required: false, description: "User age" },
        },
      })
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
    expect(result).toStrictEqual(["string"])
  })
  it("should convert oneOf type to union of types", () => {
    const schema: JSONSchema = {
      oneOf: [{ type: "string" }, { type: "null" }],
    }
    const result = convertType(schema)
    expect(result).toStrictEqual<PropTypeIR>({ __union: ["string", "null"] })
  })
  it("should onvert oneOf type with format to union of types with format", () => {
    const schema: JSONSchema = {
      oneOf: [{ type: "string", format: "date-time" }, { type: "null" }],
    }
    const result = convertType(schema)
    expect(result).toStrictEqual<PropTypeIR>({
      __union: [{ __format: "date-time", type: "string" }, "null"],
    })
  })
})

describe("buildTypeSpecIR", () => {
  context("should handle functions", () => {
    it("with basic TypeSpec IR", () => {
      const slsIR: ServerlessIR[] = [
        {
          kind: "function",
          name: "hello",
          event: {
            method: "get",
            path: "/hello",
          },
        },
      ]
      const result = buildTypeSpecIR(slsIR)
      expect(result).toStrictEqual<TypeSpecIR[]>([
        {
          kind: "operation",
          name: "hello",
          method: "get",
          route: "/hello",
        },
      ])
    })
    it("with request models", () => {
      const slsIR: ServerlessIR[] = [
        {
          kind: "function",
          name: "hello",
          event: {
            method: "post",
            path: "/hello",
            request: {
              body: {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                  },
                },
              },
            },
          },
        },
      ]
      const result = buildTypeSpecIR(slsIR)
      expect(result).toStrictEqual<TypeSpecIR[]>([
        {
          kind: "operation",
          name: "hello",
          method: "post",
          route: "/hello",
          requestBody: {
            type: {
              name: { type: "string", required: false },
            },
            required: true,
          },
        },
      ])
    })
    it("with path parameters", () => {
      const slsIR: ServerlessIR[] = [
        {
          kind: "function",
          name: "hello",
          event: {
            method: "get",
            path: "/hello/:name",
            request: {
              path: {
                name: { required: true, description: "Name of the user" },
              },
            },
          },
        },
      ]
      const result = buildTypeSpecIR(slsIR)
      expect(result).toStrictEqual<TypeSpecIR[]>([
        {
          kind: "operation",
          name: "hello",
          method: "get",
          route: "/hello/:name",
          parameters: {
            name: {
              type: "string",
              required: true,
              description: "Name of the user",
            },
          },
          http: {
            params: ["name"],
          },
        },
      ])
    })
    it("with anonymous response model", () => {
      const slsIR: ServerlessIR[] = [
        {
          kind: "function",
          name: "getUser",
          event: {
            method: "get",
            path: "/users/{id}",
            request: {
              path: {
                id: { required: true },
              },
            },
            responses: [
              {
                statusCode: 200,
                body: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    email: { type: "string" },
                  },
                },
              },
            ],
          },
        },
      ]
      const result = buildTypeSpecIR(slsIR)
      expect(result).toStrictEqual<TypeSpecIR[]>([
        {
          kind: "operation",
          name: "getUser",
          method: "get",
          route: "/users/{id}",
          parameters: {
            id: { type: "string", required: true },
          },
          returnType: [
            {
              statusCode: 200,
              body: {
                id: { type: "string", required: false },
                name: { type: "string", required: false },
                email: { type: "string", required: false },
              },
            },
          ],
          http: {
            params: ["id"],
          },
        },
      ])
    })
    it("with array response model", () => {
      const slsIR: ServerlessIR[] = [
        {
          kind: "function",
          name: "getUsers",
          event: {
            method: "get",
            path: "/users",
            responses: [
              {
                statusCode: 200,
                body: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      email: { type: "string" },
                    },
                  },
                },
              },
            ],
          },
        },
      ]
      const result = buildTypeSpecIR(slsIR)
      expect(result).toStrictEqual<TypeSpecIR[]>([
        {
          kind: "operation",
          name: "getUsers",
          method: "get",
          route: "/users",
          returnType: [
            {
              statusCode: 200,
              body: [
                {
                  id: { type: "string", required: false },
                  name: { type: "string", required: false },
                  email: { type: "string", required: false },
                },
              ],
            },
          ],
        },
      ])
    })
    it("with array schema", () => {
      const slsIR: ServerlessIR[] = [
        {
          kind: "function",
          name: "getUsers",
          event: {
            method: "get",
            path: "/users",
            responses: [
              {
                statusCode: 200,
                body: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    email: { type: "string" },
                  },
                  required: ["id", "name", "email"],
                },
              },
            ],
          },
        },
      ]
      const result = buildTypeSpecIR(slsIR)
      expect(result).toStrictEqual<TypeSpecIR[]>([
        {
          kind: "operation",
          name: "getUsers",
          method: "get",
          route: "/users",
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
        },
      ])
    })
    it("with api gateway request model", () => {
      const slsIR: ServerlessIR[] = [
        {
          kind: "model",
          key: "user",
          name: "User",
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
            },
            required: ["name", "email"],
          },
        },
        {
          kind: "function",
          name: "hello",
          event: {
            method: "get",
            path: "/hello",
            request: {
              body: { schema: "user" },
            },
          },
        },
      ]
      const result = buildTypeSpecIR(slsIR)
      expect(result).toStrictEqual<TypeSpecIR[]>([
        {
          kind: "operation",
          name: "hello",
          method: "get",
          route: "/hello",
          requestBody: { type: { __ref: "User" }, required: true },
        },
        {
          kind: "model",
          name: "User",
          props: {
            name: { type: "string", required: true },
            email: { type: "string", required: true },
          },
        },
      ])
    })
  })
})

describe("buildOperationIR", () => {
  context("should build Operation IR", () => {
    it("with basic operation", () => {
      const slsIR: ServerlessFunctionIR = {
        kind: "function",
        name: "hello",
        event: {
          method: "get",
          path: "/hello",
        },
      }

      const result = buildOperationIR(slsIR, new Registry<TypeSpecIR>())
      expect(result).toStrictEqual<TypeSpecOperationIR>({
        kind: "operation",
        name: "hello",
        method: "get",
        route: "/hello",
      })
    })
    it("with request schema", () => {
      const slsIR: ServerlessFunctionIR = {
        kind: "function",
        name: "hello",
        event: {
          method: "post",
          path: "/hello",
          request: {
            body: {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                },
                required: ["name", "email"],
              },
            },
          },
        },
      }
      const result = buildOperationIR(slsIR, new Registry<TypeSpecIR>())
      expect(result).toStrictEqual<TypeSpecOperationIR>({
        kind: "operation",
        name: "hello",
        method: "post",
        route: "/hello",
        requestBody: {
          type: {
            name: { type: "string", required: true },
            email: { type: "string", required: true },
          },
          required: true,
        },
      })
    })
    it("with named request schema", () => {
      const slsIR: ServerlessFunctionIR = {
        kind: "function",
        name: "hello",
        event: {
          method: "get",
          path: "/hello",
          request: {
            body: { schema: "User" },
          },
        },
      }
      const result = buildOperationIR(slsIR, new Registry<TypeSpecIR>())
      expect(result).toStrictEqual<TypeSpecOperationIR>({
        kind: "operation",
        name: "hello",
        method: "get",
        route: "/hello",
        requestBody: { type: { __ref: "User" }, required: true },
      })
    })
    it("with path parameters", () => {
      const slsIR: ServerlessFunctionIR = {
        kind: "function",
        name: "hello",
        event: {
          method: "get",
          path: "/hello/:name",
          request: {
            path: {
              name: { required: true },
            },
          },
        },
      }
      const result = buildOperationIR(slsIR, new Registry<TypeSpecIR>())
      expect(result).toStrictEqual<TypeSpecOperationIR>({
        kind: "operation",
        name: "hello",
        method: "get",
        route: "/hello/:name",
        parameters: {
          name: { type: "string", required: true },
        },
        http: {
          params: ["name"],
        },
      })
    })
    it("with response schema", () => {
      const slsIR: ServerlessFunctionIR = {
        kind: "function",
        name: "hello",
        event: {
          method: "get",
          path: "/hello",
          responses: [
            {
              statusCode: 200,
              body: {
                type: "object",
                properties: {
                  name: { type: "string" },
                },
                required: ["name"],
              },
            },
          ],
        },
      }
      const result = buildOperationIR(slsIR, new Registry<TypeSpecIR>())
      expect(result).toStrictEqual<TypeSpecOperationIR>({
        kind: "operation",
        name: "hello",
        method: "get",
        route: "/hello",
        returnType: [
          {
            statusCode: 200,
            body: {
              name: { type: "string", required: true },
            },
          },
        ],
      })
    })
    it("with reference response", () => {
      const slsIR: ServerlessFunctionIR = {
        kind: "function",
        name: "hello",
        event: {
          method: "get",
          path: "/hello",
          responses: ["HelloResponse"],
        },
      }
      const result = buildOperationIR(slsIR, new Registry<TypeSpecIR>())
      expect(result).toStrictEqual<TypeSpecOperationIR>({
        kind: "operation",
        name: "hello",
        method: "get",
        route: "/hello",
        returnType: { __union: [{ __ref: "HelloResponse" }] },
      })
    })
    it("with multiple response schemas", () => {
      const slsIR: ServerlessFunctionIR = {
        kind: "function",
        name: "hello",
        event: {
          method: "get",
          path: "/hello",
          responses: [
            {
              statusCode: 200,
              body: {
                type: "object",
                properties: {
                  name: { type: "string" },
                },
                required: ["name"],
              },
            },
            {
              statusCode: 404,
              body: {
                type: "object",
                properties: {
                  message: { type: "string" },
                },
                required: ["message"],
              },
            },
          ],
        },
      }
      const result = buildOperationIR(slsIR, new Registry<TypeSpecIR>())
      expect(result).toStrictEqual<TypeSpecOperationIR>({
        kind: "operation",
        name: "hello",
        method: "get",
        route: "/hello",
        returnType: [
          {
            statusCode: 200,
            body: {
              name: { type: "string", required: true },
            },
          },
          {
            statusCode: 404,
            body: {
              message: { type: "string", required: true },
            },
          },
        ],
      })
    })
    it("with multiple reference responses", () => {
      const slsIR: ServerlessFunctionIR = {
        kind: "function",
        name: "hello",
        event: {
          method: "get",
          path: "/hello",
          responses: ["HelloResponse", "NotFoundResponse"],
        },
      }
      const result = buildOperationIR(slsIR, new Registry<TypeSpecIR>())
      expect(result).toStrictEqual<TypeSpecOperationIR>({
        kind: "operation",
        name: "hello",
        method: "get",
        route: "/hello",
        returnType: {
          __union: [{ __ref: "HelloResponse" }, { __ref: "NotFoundResponse" }],
        },
      })
    })
    it("with multiple complex responses", () => {
      const slsIR: ServerlessFunctionIR = {
        kind: "function",
        name: "hello",
        event: {
          method: "get",
          path: "/hello",
          responses: [
            {
              statusCode: 200,
              body: {
                type: "object",
                properties: {
                  name: { type: "string" },
                },
                required: ["name"],
              },
            },
            {
              statusCode: 404,
              body: "NotFoundResponse",
            },
          ],
        },
      }
      const result = buildOperationIR(slsIR, new Registry<TypeSpecIR>())
      expect(result).toStrictEqual<TypeSpecOperationIR>({
        kind: "operation",
        name: "hello",
        method: "get",
        route: "/hello",
        returnType: [
          {
            statusCode: 200,
            body: {
              name: { type: "string", required: true },
            },
          },
          {
            statusCode: 404,
            body: { __ref: "NotFoundResponse" },
          },
        ],
      })
    })
    it("with summary", () => {
      const slsIR: ServerlessFunctionIR = {
        kind: "function",
        name: "hello",
        event: {
          method: "get",
          path: "/hello",
          summary: "Say hello",
        },
      }
      const result = buildOperationIR(slsIR, new Registry<TypeSpecIR>())
      expect(result).toStrictEqual<TypeSpecOperationIR>({
        kind: "operation",
        name: "hello",
        summary: "Say hello",
        method: "get",
        route: "/hello",
      })
    })
    it("with description", () => {
      const slsIR: ServerlessFunctionIR = {
        kind: "function",
        name: "hello",
        event: {
          description: "Say hello",
          method: "get",
          path: "/hello",
        },
      }
      const result = buildOperationIR(slsIR, new Registry<TypeSpecIR>())
      expect(result).toStrictEqual<TypeSpecOperationIR>({
        kind: "operation",
        name: "hello",
        description: "Say hello",
        method: "get",
        route: "/hello",
      })
    })
    it("with request body description", () => {
      const slsIR: ServerlessFunctionIR = {
        kind: "function",
        name: "hello",
        event: {
          method: "post",
          path: "/hello",
          request: {
            body: {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                },
              },
              description: "Request body for hello",
            },
          },
        },
      }
      const result = buildOperationIR(slsIR, new Registry<TypeSpecIR>())
      expect(result).toStrictEqual<TypeSpecOperationIR>({
        kind: "operation",
        name: "hello",
        method: "post",
        route: "/hello",
        requestBody: {
          type: {
            name: { type: "string", required: false },
          },
          required: true,
          description: "Request body for hello",
        },
      })
    })
  })
})
