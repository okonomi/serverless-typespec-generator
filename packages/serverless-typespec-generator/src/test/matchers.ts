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
    const pass = receivedFormatted === expected
    return {
      pass,
      message: () =>
        pass
          ? `expected TypeSpec not to equal\n${expected}`
          : `expected TypeSpec to equal\n${expected}\n\nreceived:\n${receivedFormatted}`,
      actual: receivedFormatted,
      expected: expected,
    }
  },
})

declare module "vitest" {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  interface Assertion<T = any> {
    toTypeSpecEqual(expected: string): Promise<void>
  }
}
