import { describe, expect, it } from "vitest"
import { buildOperationIR, buildTypeSpecIR } from "./build"
import type { ServerlessFunctionIR, ServerlessIR } from "./serverless/type"
import type { OperationIR, TypeSpecIR } from "./type"

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
    expect(result).toEqual<TypeSpecIR[]>([
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
            type: "object",
            properties: {
              name: { type: "string" },
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
        method: "post",
        route: "/hello",
        requestBody: {
          name: { type: "string", required: false },
        },
      },
    ])
  })
})

describe("buildOperationIR", () => {
  it("should build operation IR correctly", () => {
    const slsIR: ServerlessFunctionIR = {
      kind: "function",
      name: "hello",
      event: {
        method: "get",
        path: "/hello",
      },
    }

    const result = buildOperationIR(slsIR)
    expect(result).toEqual<OperationIR>({
      kind: "operation",
      name: "hello",
      method: "get",
      route: "/hello",
    })
  })
  it("should build operation IR with request schema", () => {
    const slsIR: ServerlessFunctionIR = {
      kind: "function",
      name: "hello",
      event: {
        method: "post",
        path: "/hello",
        request: {
          title: "User",
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
          },
          required: ["name", "email"],
        },
      },
    }
    const result = buildOperationIR(slsIR)
    expect(result).toEqual<OperationIR>({
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
})
