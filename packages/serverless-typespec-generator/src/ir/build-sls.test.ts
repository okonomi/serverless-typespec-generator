import { describe, expect, it } from "vitest"
import { buildOperationIR } from "./build"
import type { ServerlessFunctionIR } from "./serverless/type"
import type { OperationIR } from "./type"

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
