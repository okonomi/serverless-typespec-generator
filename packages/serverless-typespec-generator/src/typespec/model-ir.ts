import type { JSONSchema4 } from "json-schema"

export type JSONSchema = JSONSchema4

export type ModelIR = {
  name: string
  props: Record<string, PropIR>
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
  | { array: PropTypeIR }
  | { object: Record<string, PropIR> }

export function jsonSchemaToModelIR(schema: JSONSchema, name: string): ModelIR {
  let props: Record<string, PropIR> = {}

  if (schema.type === "object") {
    props = extractProps(schema)
  }

  return { name, props }

  // for (const [key, value] of Object.entries(schema.properties ?? {})) {
  //   if (value.type === "object") {
  //     model.props[key] = {
  //       type: { object: jsonSchemaToModelIR(value).props },
  //       required: value.required ?? false,
  //     }
  //   } else if (value.type === "array") {
  //     model.props[key] = {
  //       type: { array: value.items?.type ?? "string" },
  //       required: value.required ?? false,
  //     }
  //   } else {
  //     model.props[key] = {
  //       type: value.type,
  //       required: value.required ?? false,
  //     }
  //   }
  // }
}

function extractProps(schema: JSONSchema): Record<string, PropIR> {
  const required = new Set(
    Array.isArray(schema.required) ? schema.required : [],
  )
  const out: Record<string, PropIR> = {}

  for (const [key, def] of Object.entries(schema.properties || {})) {
    out[key] = {
      type: convertType(def),
      required: required.has(key),
    }
  }

  return out
}

function convertType(schema: JSONSchema): PropTypeIR {
  switch (schema.type) {
    case "string":
      return "string"
    case "integer":
      return "int32"
    case "number":
      return "float64"
    case "boolean":
      return "boolean"
    case "array":
      if (!schema.items || Array.isArray(schema.items)) {
        throw new Error("Array 'items' must be a single schema object")
      }
      return { array: convertType(schema.items) }
    case "object":
      return { object: extractProps(schema) }
    default:
      throw new Error(`Unknown type: ${schema.type}`)
  }
}

export function emitTypeSpec(model: ModelIR): string {
  const lines: string[] = []

  lines.push(`model ${model.name} {`)
  for (const [name, prop] of Object.entries(model.props)) {
    const type = renderType(prop.type)
    const optional = prop.required ? "" : "?"
    lines.push(`${name}${optional}: ${type};`)
  }
  lines.push("}")

  return lines.join("\n")
}

function renderType(type: PropTypeIR): string {
  if (typeof type === "string") {
    return type
  }

  if ("array" in type) {
    return `${renderType(type.array)}[]`
  }

  if ("object" in type) {
    const props = Object.entries(type.object)
      .map(([name, prop]) => `${name}: ${renderType(prop.type)}`)
      .join(", ")
    return `{ ${props} }`
  }

  throw new Error(`Unknown type: ${type}`)
}
