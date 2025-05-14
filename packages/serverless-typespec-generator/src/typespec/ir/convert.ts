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

function mergeAllOfObjectSchemas(allOf: JSONSchema[]): Record<string, PropIR> {
  const required = new Set<string>()
  let props: Record<string, PropIR> = {}
  for (const subSchema of allOf) {
    if (subSchema.type !== "object") {
      throw new NotImplementedError(
        `Unsupported schema type in allOf: ${subSchema.type}`,
      )
    }
    if (Array.isArray(subSchema.required)) {
      for (const key of subSchema.required) {
        required.add(key)
      }
    }
    props = { ...props, ...extractProps(subSchema) }
  }
  for (const key of required) {
    if (key in props) {
      props[key].required = true
    }
  }
  return props
}

export function jsonSchemaToModelIR(schema: JSONSchema, name: string): ModelIR {
  if (schema.type === "object" || schema.allOf) {
    const props = extractProps(schema)
    return { kind: "model", name, props }
  }
  throw new Error(`Unsupported schema type: ${schema.type}`)
}

export function extractProps(schema: JSONSchema): Record<string, PropIR> {
  if (schema.allOf) {
    return mergeAllOfObjectSchemas(schema.allOf)
  }

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
