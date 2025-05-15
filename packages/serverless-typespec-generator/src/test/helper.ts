import type { AWS } from "@serverless/typescript"
import { formatTypeSpec } from "@typespec/compiler"
import { vi } from "vitest"
import type { SLS } from "../types/serverless"

export function createServerlessMock(
  functions: NonNullable<AWS["functions"]>,
  apiGateway?: AWS["provider"]["apiGateway"],
): SLS {
  return {
    service: {
      provider: {
        ...(apiGateway && { apiGateway }),
      },
      getAllFunctions: vi.fn(() => {
        return Object.values(functions).map((fn) => fn.name)
      }),
      getAllEventsInFunction: vi.fn((functionName: string) => {
        const fn = Object.values(functions).find((f) => f.name === functionName)
        if (!fn) {
          return []
        }
        return fn.events
      }),
    },
  } as unknown as SLS
}

export async function normalizeTypeSpec(code: string) {
  const formattedCode = await formatTypeSpec(code, {
    indent: "  ",
    lineWidth: 80,
    trailingNewline: false,
  })
  return formattedCode.trimEnd()
}
