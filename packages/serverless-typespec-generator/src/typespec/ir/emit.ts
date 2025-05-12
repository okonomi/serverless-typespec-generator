import type {
  ModelIR,
  OperationIR,
  PropTypeIR,
  RefType,
  TypeSpecIR,
} from "./type"

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

export function emitOperation(operation: OperationIR): string {
  const lines: string[] = []

  const parameters: string[] = []
  if (operation.requestBody) {
    parameters.push(`@body body: ${renderType(operation.requestBody)}`)
  }

  const returnType = operation.responseBody
    ? renderType(operation.responseBody)
    : "void"

  lines.push(`@route("${operation.route}")`)
  lines.push(`@${operation.method}`)
  lines.push(`op ${operation.name}(${parameters.join(", ")}): ${returnType};`)

  return lines.join("\n")
}

function renderType(type: PropTypeIR): string {
  if (typeof type === "string") {
    return type
  }

  if (Array.isArray(type)) {
    return `${renderType(type[0])}[]`
  }

  if (isRefType(type)) {
    return type.ref
  }

  const props = Object.entries(type)
    .map(([name, prop]) => `${name}: ${renderType(prop.type)}`)
    .join(", ")
  return `{ ${props} }`
}

function isRefType(type: PropTypeIR): type is RefType {
  return typeof type === "object" && "ref" in type
}
