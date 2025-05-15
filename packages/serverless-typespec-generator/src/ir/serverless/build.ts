import type { Serverless } from "../../types/serverless"
import type { ServerlessIR } from "./type"

export function buildServerlessIR(serverless: Serverless): ServerlessIR[] {
  const irList: ServerlessIR[] = []

  for (const functionName of serverless.service.getAllFunctions()) {
    const events = serverless.service.getAllEventsInFunction(functionName)
    const event = events.find((event) => "http" in event && event.http)
    if (!event) {
      // TODO: logging
      continue
    }
    if (!("http" in event) || !event.http) {
      // TODO: logging
      continue
    }
    if (!isHttpMethod(event.http.method)) {
      // TODO: logging
      continue
    }

    irList.push({
      kind: "function",
      name: normalizeFunctionName(functionName),
      event: {
        method: event.http.method,
        path: normalizePath(event.http.path),
      },
    })
  }

  return irList
}

function isHttpMethod(
  method: string,
): method is "get" | "post" | "put" | "delete" | "patch" {
  return (
    method === "get" ||
    method === "post" ||
    method === "put" ||
    method === "delete" ||
    method === "patch"
  )
}

function normalizePath(path: string) {
  if (!path.startsWith("/")) {
    return `/${path}`
  }

  return path
}

function normalizeFunctionName(name: string) {
  return toCamelCase(name)
}

function toCamelCase(str: string) {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toLowerCase())
}
