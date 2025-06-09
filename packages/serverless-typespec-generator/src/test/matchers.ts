import { formatTypeSpec } from "@typespec/compiler"
import { expect } from "vitest"

expect.extend({
  async toTypeSpecEqual(received: string, expected: string) {
    const format = async (code: string) =>
      (
        await formatTypeSpec(code, {
          indent: "  ",
          lineWidth: 80,
          trailingNewline: false,
        })
      ).trimEnd()
    const receivedFormatted = await format(received)
    const expectedFormatted = await format(expected)
    const pass = receivedFormatted === expectedFormatted
    return {
      pass,
      message: () =>
        pass
          ? `expected TypeSpec not to equal\n${expectedFormatted}`
          : `expected TypeSpec to equal\n${expectedFormatted}\n\nreceived:\n${receivedFormatted}`,
      actual: receivedFormatted,
      expected: expectedFormatted,
    }
  },
})

declare module "vitest" {
  interface Assertion<T = any> {
    toTypeSpecEqual(expected: string): Promise<void>
  }
}
