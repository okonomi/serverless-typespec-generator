import type { JSONSchema4 } from "json-schema"

export type JSONSchema = JSONSchema4

export type TypeSpecIR =
  | { kind: "alias"; name: string; type: PropTypeIR }
  | { kind: "model"; model: ModelIR }

export type ModelIR = {
  name: string
  props: Record<string, PropIR>
}

export type OperationIR = {
  name: string
  method: "get" | "post" | "put" | "delete"
  route: string
  requestBody?: PropTypeIR
  responseBody?: PropTypeIR
}

export type PropIR = {
  type: PropTypeIR
  required: boolean
}

export type PropTypeIR =
  | "string"
  | "int32"
  | "float64"
  | "boolean"
  | PropTypeIR[]
  | RefType
  | Record<string, PropIR>

export type RefType = {
  ref: string
}
