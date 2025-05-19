import { describe, expect, it } from "vitest"
import { Registry } from "../../registry"
import type { ServerlessFunctionIR, ServerlessIR } from "./../serverless/type"
import { buildOperationIR, buildTypeSpecIR } from "./build"
import type { TypeSpecIR, TypeSpecOperationIR } from "./type"

const context = describe

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
                type: "object",
                properties: {
                  name: { type: "string" },
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
            name: { type: "string", required: false },
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
                name: true,
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
            name: { type: "string", required: true },
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
                id: true,
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
              body: "user",
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
          requestBody: { ref: "User" },
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
              type: "object",
              properties: {
                name: { type: "string" },
                email: { type: "string" },
              },
              required: ["name", "email"],
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
          name: { type: "string", required: true },
          email: { type: "string", required: true },
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
            body: "User",
          },
        },
      }
      const result = buildOperationIR(slsIR, new Registry<TypeSpecIR>())
      expect(result).toStrictEqual<TypeSpecOperationIR>({
        kind: "operation",
        name: "hello",
        method: "get",
        route: "/hello",
        requestBody: { ref: "User" },
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
              name: true,
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
        returnType: { union: [{ ref: "HelloResponse" }] },
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
          union: [{ ref: "HelloResponse" }, { ref: "NotFoundResponse" }],
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
            body: { ref: "NotFoundResponse" },
          },
        ],
      })
    })
  })
})
