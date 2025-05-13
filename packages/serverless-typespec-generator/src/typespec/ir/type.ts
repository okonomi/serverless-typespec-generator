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
  method: "get" | "post" | "put" | "delete" | "patch"
  route: string
  requestBody?: PropTypeIR
  returnType?: PropTypeIR | HttpResponseIR | HttpResponseIR[]
}

export type HttpResponseIR = {
  statusCode: number
  body: PropTypeIR
}

export type PropIR = {
  type: PropTypeIR
  required: boolean
}

export type PropTypeIR =
  | PrimitiveType
  | RefType
  | UnionType
  | Record<string, PropIR>
  | PropTypeIR[]

export type PrimitiveType = "numeric" | "string" | "boolean"

export type RefType = {
  ref: string
}

export type UnionType = {
  union: PropTypeIR[]
}

export function isHttpResponse(type: unknown): type is HttpResponseIR {
  return (
    typeof type === "object" &&
    type !== null &&
    "statusCode" in type &&
    "body" in type &&
    typeof type.statusCode === "number"
  )
}

export function isHttpResponses(type: unknown): type is HttpResponseIR[] {
  return Array.isArray(type) && type.every((t) => isHttpResponse(t))
}

export function isPrimitiveType(type: PropTypeIR): type is PrimitiveType {
  return type === "numeric" || type === "string" || type === "boolean"
}

export function isRefType(type: PropTypeIR): type is RefType {
  return typeof type === "object" && "ref" in type
}

export function isUnionType(type: PropTypeIR): type is UnionType {
  return typeof type === "object" && "union" in type
}

export function isObjectType(type: PropTypeIR): type is Record<string, PropIR> {
  return typeof type === "object" && !isRefType(type)
}

export function isArrayType(type: PropTypeIR): type is PropTypeIR[] {
  return Array.isArray(type)
}
