import type { ModelIR, PropTypeIR, TypeSpecIR } from "./type"

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
