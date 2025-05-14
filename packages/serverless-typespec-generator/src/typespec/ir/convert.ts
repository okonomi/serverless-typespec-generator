import { extractProps } from "../../ir/build"
import type { JSONSchema, PropTypeIR } from "./type"

export function convertType(schema: JSONSchema): PropTypeIR {
  if (schema.oneOf) {
    const types = schema.oneOf.map(convertType)
    return { union: types }
  }

  if (schema.type === "object" || schema.allOf) {
    return extractProps(schema)
  }

  switch (schema.type) {
    case "string":
      return "string"
    case "integer":
      return "numeric"
    case "number":
      return "numeric"
    case "boolean":
      return "boolean"
    case "null":
      return "null"
    case "array":
      if (!schema.items || Array.isArray(schema.items)) {
        throw new Error("Array 'items' must be a single schema object")
      }
      return [convertType(schema.items)]
    default:
      throw new Error(`Unknown type: ${schema.type}`)
  }
}
