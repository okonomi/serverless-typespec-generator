import { NotImplementedError } from "./error"
import type {
  JSONSchema,
  ModelIR,
  PropIR,
  PropTypeIR,
  TypeSpecIR,
} from "./type"

export function jsonSchemaToTypeSpecIR(
  schema: JSONSchema,
  name: string,
): TypeSpecIR {
  if (schema.type === "array") {
    if (!schema.items || Array.isArray(schema.items)) {
      throw new Error("Array 'items' must be a single schema object")
    }
    const type = [convertType(schema.items)]
    return { kind: "alias", name, type }
  }
  if (schema.type === "object" || schema.allOf) {
    return jsonSchemaToModelIR(schema, name)
  }

  throw new Error(`Unsupported schema type: ${schema.type}`)
}

export function jsonSchemaToModelIR(schema: JSONSchema, name: string): ModelIR {
  if (schema.type === "object") {
    const props = extractProps(schema)
    return { kind: "model", name, props }
  }

  if (schema.allOf) {
    let props: Record<string, PropIR> = {}
    for (const subSchema of schema.allOf) {
      if (subSchema.type !== "object") {
        throw new NotImplementedError(
          `Unsupported schema type in allOf: ${subSchema.type}`,
        )
      }
      props = { ...props, ...extractProps(subSchema) }
    }
    return { kind: "model", name, props }
  }

  throw new Error(`Unsupported schema type: ${schema.type}`)
}

export function extractProps(schema: JSONSchema): Record<string, PropIR> {
  const required = new Set(
    Array.isArray(schema.required) ? schema.required : [],
  )
  const props: Record<string, PropIR> = {}

  for (const [key, def] of Object.entries(schema.properties || {})) {
    props[key] = {
      type: convertType(def),
      required: required.has(key),
    }
  }

  return props
}

function convertType(schema: JSONSchema): PropTypeIR {
  switch (schema.type) {
    case "string":
      return "string"
    case "integer":
      return "numeric"
    case "number":
      return "numeric"
    case "boolean":
      return "boolean"
    case "array":
      if (!schema.items || Array.isArray(schema.items)) {
        throw new Error("Array 'items' must be a single schema object")
      }
      return [convertType(schema.items)]
    case "object":
      return extractProps(schema)
    default:
      throw new Error(`Unknown type: ${schema.type}`)
  }
}
