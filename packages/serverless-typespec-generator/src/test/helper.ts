import type { AWS } from "@serverless/typescript"
import { formatTypeSpec } from "@typespec/compiler"
import { vi } from "vitest"
import type {
  FunctionsWithDocumentation,
  Serverless,
} from "../types/serverless"

export function createServerlessMock(
  functions: FunctionsWithDocumentation,
  apiGateway?: AWS["provider"]["apiGateway"],
): Serverless {
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
        return fn?.events ?? []
      }),
    },
  } as unknown as Serverless
}

export async function normalizeTypeSpec(code: string) {
  const formattedCode = await formatTypeSpec(code, {
    indent: "  ",
    lineWidth: 80,
    trailingNewline: false,
  })
  return formattedCode.trimEnd()
}
