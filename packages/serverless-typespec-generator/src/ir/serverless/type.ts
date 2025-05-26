import type { JSONSchema } from "~/types/json-schema"

export type ServerlessIR = ServerlessModelIR | ServerlessFunctionIR

export type ServerlessModelIR = {
  kind: "model"
  key: string
  name: string
  schema: JSONSchema
}

export type ServerlessFunctionIR = {
  kind: "function"
  name: string
  event: ServerlessHttpEventIR
}

export type ServerlessHttpEventIR = {
  summary?: string
  description?: string
  method: "get" | "post" | "put" | "delete" | "patch"
  path: string
  request?: ServerlessHttpRequestIR
  responses?: (ServerlessHttpResponseIR | string)[]
}

export type ServerlessHttpRequestIR = {
  body?: {
    schema: JSONSchema | string
    description?: string
  }
  path?: Record<
    string,
    {
      required: boolean
      description?: string
    }
  >
  // query?: Record<string, boolean>
  // headers?: Record<string, boolean>
  // cookies?: Record<string, boolean>
}

export type ServerlessHttpResponseIR = {
  statusCode: number
  body: JSONSchema | string
}
