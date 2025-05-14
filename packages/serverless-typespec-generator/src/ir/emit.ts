import { renderType } from "../typespec/ir/emit"
import {
  type AliasIR,
  type HttpResponseIR,
  type ModelIR,
  type OperationIR,
  type TypeSpecIR,
  isHttpResponse,
  isHttpResponses,
} from "../typespec/ir/type"

export function emitTypeSpec(irList: TypeSpecIR[]): string {
  const lines: string[] = []
  lines.push('import "@typespec/http";')
  lines.push("")
  lines.push("using Http;")
  lines.push("")

  lines.push('@service(#{ title: "Generated API" })')
  lines.push("namespace GeneratedApi;")
  lines.push("")

  for (const ir of irList) {
    lines.push(emitIR(ir))
    lines.push("")
  }

  return lines.join("\n")
}

export function emitIR(ir: TypeSpecIR): string {
  if (ir.kind === "model") {
    return emitModel(ir)
  }
  if (ir.kind === "alias") {
    return emitAlias(ir)
  }
  if (ir.kind === "operation") {
    return emitOperation(ir)
  }

  throw new Error(`Unknown IR: ${ir}`)
}

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
