import { describe, expect, it } from "vitest"
import { buildOperationIR, buildTypeSpecIR } from "./build"
import type { ServerlessFunctionIR, ServerlessIR } from "./serverless/type"
import type { OperationIR, TypeSpecIR } from "./type"

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
                title: "HelloRequest",
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
          requestBody: { ref: "HelloRequest" },
        },
        {
          kind: "model",
          name: "HelloRequest",
          props: {
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
            response: {
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

      const result = buildOperationIR(slsIR)
      expect(result).toStrictEqual<OperationIR>({
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
      const result = buildOperationIR(slsIR)
      expect(result).toStrictEqual<OperationIR>({
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
            body: {
              title: "User",
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
      const result = buildOperationIR(slsIR)
      expect(result).toStrictEqual<OperationIR>({
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
      const result = buildOperationIR(slsIR)
      expect(result).toStrictEqual<OperationIR>({
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
  })
})
