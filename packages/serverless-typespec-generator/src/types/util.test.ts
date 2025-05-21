import { describe, expectTypeOf, it } from "vitest"
import type { ReplaceByPath } from "./util"

describe("ReplaceByPath", () => {
  it("sample test", () => {
    type Test = {
      a: number
      b: string
    }
    type Result = ReplaceByPath<Test, "a", string>
    expectTypeOf<Result>().toEqualTypeOf<{
      a: string
      b: string
    }>()
  })
})
