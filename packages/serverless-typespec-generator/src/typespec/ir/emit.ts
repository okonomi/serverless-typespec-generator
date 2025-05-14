import {
  type AliasIR,
  type HttpResponseIR,
  type ModelIR,
  type OperationIR,
  type PropTypeIR,
  isArrayType,
  isHttpResponse,
  isHttpResponses,
  isPrimitiveType,
  isRefType,
  isUnionType,
} from "./type"

export function emitAlias(alias: AliasIR): string {
  const type = renderType(alias.type)
  return `alias ${alias.name} = ${type};`
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
  const paramEntries = Object.entries(operation.parameters ?? {})
  const pathParams = new Set(operation.http?.params ?? [])
  for (const [name, prop] of paramEntries) {
    const decorator = pathParams.has(name) ? "@path" : ""
    const optional = prop.required ? "" : "?"
    const type = renderType(prop.type)
    parameters.push(`${decorator} ${name}${optional}: ${type}`)
  }

  if (operation.requestBody) {
    parameters.push(`@body body: ${renderType(operation.requestBody)}`)
  }

  let returnType = "void"
  if (isHttpResponses(operation.returnType)) {
    returnType = operation.returnType.map(renderHttpResponse).join(" | ")
  } else if (isHttpResponse(operation.returnType)) {
    returnType = renderHttpResponse(operation.returnType)
  } else if (operation.returnType) {
    returnType = renderType(operation.returnType)
  }

  lines.push(`@route("${operation.route}")`)
  lines.push(`@${operation.method}`)
  lines.push(`op ${operation.name}(${parameters.join(", ")}): ${returnType};`)

  return lines.join("\n")
}

function renderHttpResponse(r: HttpResponseIR): string {
  const body = renderType(r.body)
  return `{ @statusCode statusCode: ${r.statusCode}; @body body: ${body} }`
}

function renderType(type: PropTypeIR): string {
  if (isPrimitiveType(type)) {
    return type
  }

  if (isArrayType(type)) {
    return `${renderType(type[0])}[]`
  }

  if (isRefType(type)) {
    return type.ref
  }

  if (isUnionType(type)) {
    return type.union.map(renderType).join(" | ")
  }

  const props = Object.entries(type)
    .map(([name, prop]) => `${name}: ${renderType(prop.type)}`)
    .join(", ")
  return `{ ${props} }`
}
