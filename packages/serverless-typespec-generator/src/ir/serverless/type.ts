import type { JSONSchema } from "../type"

export type ServerlessIR = ServerlessModelIR | ServerlessFunctionIR

export type ServerlessModelIR = {
  kind: "model"
  key: string
  name?: string
  schema: JSONSchema
}

export type ServerlessFunctionIR = {
  kind: "function"
  name: string
  event: ServerlessHttpEventIR
}

export type ServerlessHttpEventIR = {
  method: "get" | "post" | "put" | "delete" | "patch"
  path: string
  request?: ServerlessHttpRequestIR
  responses?: ServerlessHttpResponseOrRef | ServerlessHttpResponseOrRef[]
}

export type ServerlessHttpResponseOrRef = ServerlessHttpResponseIR | string

export type ServerlessHttpRequestIR = {
  body?: JSONSchema | string
  path?: Record<string, boolean>
  // query?: Record<string, boolean>
  // headers?: Record<string, boolean>
  // cookies?: Record<string, boolean>
}

export type ServerlessHttpResponseIR = {
  statusCode: number
  body: JSONSchema | string
}
