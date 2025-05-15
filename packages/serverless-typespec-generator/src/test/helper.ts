import { formatTypeSpec } from "@typespec/compiler"
import type Serverless from "serverless"
import { vi } from "vitest"
import type { SLS } from "../types/serverless"

export function createServerlessMock(
  functions: Serverless.FunctionDefinitionHandler[],
  apiGateway?: SLS["service"]["provider"]["apiGateway"],
): SLS {
  return {
    service: {
      provider: {
        ...(apiGateway && { apiGateway }),
      },
      getAllFunctions: vi.fn(() => {
        return functions.map((fn) => fn.name)
      }),
      getAllEventsInFunction: vi.fn((functionName: string) => {
        const fn = functions.find((f) => f.name === functionName)
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
