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
})
