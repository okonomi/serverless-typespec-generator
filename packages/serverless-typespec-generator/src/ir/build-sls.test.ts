import { describe, expect, it } from "vitest"
import { buildOperationIR, buildTypeSpecIR } from "./build"
import type { ServerlessFunctionIR, ServerlessIR } from "./serverless/type"
import type { OperationIR, TypeSpecIR } from "./type"

const context = describe

describe("buildTypeSpecIR", () => {
  it("should build the TypeSpec IR", () => {
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
  it("should handle functions with request models", () => {
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
  it("should handle functions with path parameters", () => {
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
    expect(result).toEqual<TypeSpecIR[]>([
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
})

describe("buildOperationIR", () => {
  context("should build Operation IR", () => {
    it("correctly", () => {
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
  })
  it("should build operation IR with path parameters", () => {
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
    expect(result).toEqual<OperationIR>({
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
