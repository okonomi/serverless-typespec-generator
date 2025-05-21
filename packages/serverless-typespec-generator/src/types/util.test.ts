import { describe, expectTypeOf, it } from "vitest"

describe("ReplaceByPath", () => {
  it("sample test", () => {
    type Test = {
      a: number
    }
    expectTypeOf({ a: 1 }).toEqualTypeOf<Test>()
  })
})
