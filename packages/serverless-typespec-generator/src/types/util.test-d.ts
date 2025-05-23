import { describe, expectTypeOf, it } from "vitest"
import type { Replace, ReplaceByPath } from "./util"

describe("Replace", () => {
  it("should replace type of property", () => {
    type Test = {
      a: number
      b: string
    }
    type Result = Replace<Test, "a", string>
    expectTypeOf<Result>().toEqualTypeOf<{
      a: string
      b: string
    }>()
  })
})

describe("ReplaceByPath", () => {
  it("should replace type of property", () => {
    type Test = {
      a: number
      b: string
    }
    type Result = ReplaceByPath<Test, ["a"], string>
    expectTypeOf<Result>().toEqualTypeOf<{
      a: string
      b: string
    }>()
  })
  it("should replace type of nested property", () => {
    type Test = {
      a: {
        b: number
        c: string
      }
      d: string
    }
    type Result = ReplaceByPath<Test, ["a", "b"], string>
    expectTypeOf<Result>().toEqualTypeOf<{
      a: {
        b: string
        c: string
      }
      d: string
    }>()
  })
  it("should replace type of nested property with optional", () => {
    type Test = {
      a?: {
        b?: number
        c: string
      }
      d: string
    }
    type Result = ReplaceByPath<Test, ["a", "b"], string>
    expectTypeOf<Result>().toEqualTypeOf<{
      a?: {
        b?: string
        c: string
      }
      d: string
    }>()
  })
})
