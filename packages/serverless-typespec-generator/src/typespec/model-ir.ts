import type { JSONSchema4 } from "json-schema"

export type JSONSchema = JSONSchema4

export type TypeSpecIR =
  | { kind: "alias"; name: string; type: PropTypeIR }
  | { kind: "model"; model: ModelIR }

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
  | PropTypeIR[]
  | Record<string, PropIR>

export function jsonSchemaToTypeSpecIR(schema: JSONSchema, name: string): TypeSpecIR {
  if (schema.type === "array") {
    if (!schema.items || Array.isArray(schema.items)) {
      throw new Error("Array 'items' must be a single schema object")
    }
    const type = [convertType(schema.items)]
    return { kind: "alias", name, type }
  }
  if (schema.type === "object") {
    const model = jsonSchemaToModelIR(schema, name)
    return { kind: "model", model }
  }
  throw new Error(`Unsupported schema type: ${schema.type}`)
}

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
      return [convertType(schema.items)]
    case "object":
      return extractProps(schema)
    default:
      throw new Error(`Unknown type: ${schema.type}`)
  }
}

export function emitTypeSpec(ir: TypeSpecIR): string {
  if (ir.kind === "model") {
    return emitModel(ir.model)
  }
  if (ir.kind === "alias") {
    const type = renderType(ir.type)
    return `alias ${ir.name} = ${type};`
  }

  throw new Error(`Unknown IR: ${ir}`)
}

export function emitModel(model: ModelIR): string {
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

  if (Array.isArray(type)) {
    return `${renderType(type[0])}[]`
  }

  const props = Object.entries(type)
    .map(([name, prop]) => `${name}: ${renderType(prop.type)}`)
    .join(", ")
  return `{ ${props} }`
}
