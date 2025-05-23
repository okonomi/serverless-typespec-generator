export type TypeSpecIR = TypeSpecAliasIR | TypeSpecModelIR | TypeSpecOperationIR

export type TypeSpecAliasIR = {
  kind: "alias"
  name: string
  type: PropTypeIR
}

export type TypeSpecModelIR = {
  kind: "model"
  name: string
  props: Record<string, PropIR>
}

export type TypeSpecOperationIR = {
  kind: "operation"
  name: string
  summary?: string
  description?: string
  method: "get" | "post" | "put" | "delete" | "patch"
  route: string
  parameters?: Record<string, PropIR>
  requestBody?: PropTypeIR
  returnType?: PropTypeIR | HttpResponseIR[]

  http?: {
    params?: string[]
  }
}

export type HttpResponseIR = {
  statusCode: number
  body: PropTypeIR
}

export type PropIR = {
  type: PropTypeIR
  required: boolean
  description?: string
}

export type PropTypeIR =
  | PrimitiveType
  | RefType
  | UnionType
  | Record<string, PropIR>
  | PropTypeIR[]

export type PrimitiveType = "numeric" | "string" | "boolean" | "null"

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

export function isPropType(type: unknown): type is PropTypeIR {
  return (
    isPrimitiveType(type) ||
    isRefType(type) ||
    isUnionType(type) ||
    isObjectType(type) ||
    isArrayType(type)
  )
}

export function isPrimitiveType(type: unknown): type is PrimitiveType {
  return (
    type === "numeric" ||
    type === "string" ||
    type === "boolean" ||
    type === "null"
  )
}

export function isRefType(type: unknown): type is RefType {
  return typeof type === "object" && type !== null && "ref" in type
}

export function isUnionType(type: unknown): type is UnionType {
  return typeof type === "object" && type !== null && "union" in type
}

export function isObjectType(type: unknown): type is Record<string, PropIR> {
  return typeof type === "object" && !isRefType(type)
}

export function isArrayType(type: unknown): type is PropTypeIR[] {
  return Array.isArray(type)
}
