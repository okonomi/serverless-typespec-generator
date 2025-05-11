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
