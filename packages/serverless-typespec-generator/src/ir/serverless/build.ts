import type { Serverless } from "../../types/serverless"
import type { ServerlessIR } from "./type"

export function buildServerlessIR(serverless: Serverless): ServerlessIR[] {
  const irList: ServerlessIR[] = []

  for (const functionName of serverless.service.getAllFunctions()) {
    const events = serverless.service.getAllEventsInFunction(functionName)
    const event = events.find((event) => "http" in event)
    if (!event) {
      // TODO: logging
      continue
    }

    irList.push({
      kind: "function",
      name: functionName,
    })
  }

  return irList
}
