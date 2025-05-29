export type TypeSpecIR = TypeSpecAliasIR | TypeSpecModelIR | TypeSpecOperationIR

export type TypeSpecAliasIR = {
  kind: "alias"
  name: string
  type: PropTypeIR
}

export type TypeSpecModelIR = {
  kind: "model"
  name: string
  props: PropsType
}

export type TypeSpecOperationIR = {
  kind: "operation"
  name: string
  summary?: string
  description?: string
  method: "get" | "post" | "put" | "delete" | "patch"
  route: string
  parameters?: Record<string, PropIR>
  requestBody?: PropIR
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
  | FormatType
  | PropsType
  | PropTypeIR[]

export type PrimitiveType = "numeric" | "string" | "boolean" | "null"

export type RefType = {
  __ref: string
}

export type UnionType = {
  __union: PropTypeIR[]
}

export type FormatType = {
  __format: string
  type: PropTypeIR
}

export type PropsType = Record<string, PropIR>

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
    isFormatType(type) ||
    isPropsType(type) ||
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
  return typeof type === "object" && type !== null && "__ref" in type
}

export function isUnionType(type: unknown): type is UnionType {
  return typeof type === "object" && type !== null && "__union" in type
}

export function isFormatType(type: unknown): type is FormatType {
  return typeof type === "object" && type !== null && "__format" in type
}

export function isPropsType(type: unknown): type is PropsType {
  return typeof type === "object" && !Array.isArray(type) && !isRefType(type)
}

export function isArrayType(type: unknown): type is PropTypeIR[] {
  return Array.isArray(type)
}
