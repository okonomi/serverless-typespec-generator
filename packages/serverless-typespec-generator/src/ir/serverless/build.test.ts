import { describe, expect, it } from "vitest"
import type { SLS } from "../../types/serverless"
import { buildServerlessIR } from "./build"

describe("buildServerlessIR", () => {
  it("should build the serverless IR", () => {
    const serverless = {} as SLS
    const result = buildServerlessIR(serverless)
    expect(result).toBeInstanceOf(Array)
  })
})
