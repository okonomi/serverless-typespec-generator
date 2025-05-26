import {
  type HttpResponseIR,
  type PropTypeIR,
  type TypeSpecAliasIR,
  type TypeSpecIR,
  type TypeSpecModelIR,
  type TypeSpecOperationIR,
  isArrayType,
  isHttpResponse,
  isHttpResponses,
  isPrimitiveType,
  isRefType,
  isUnionType,
} from "./type"

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

export function emitAlias(alias: TypeSpecAliasIR): string {
  const type = renderType(alias.type)
  return `alias ${alias.name} = ${type};`
}

export function emitModel(model: TypeSpecModelIR): string {
  const lines: string[] = []

  lines.push(`model ${model.name} {`)
  for (const [name, prop] of Object.entries(model.props)) {
    const type = renderType(prop.type)
    const optional = prop.required ? "" : "?"
    if (prop.description) {
      lines.push('@doc("""')
      lines.push(prop.description)
      lines.push('""")')
    }
    lines.push(`${name}${optional}: ${type};`)
  }
  lines.push("}")

  return lines.join("\n")
}

export function emitOperation(operation: TypeSpecOperationIR): string {
  const lines: string[] = []

  const emitParameter = (
    decorators: string[],
    name: string,
    type: string,
    required: boolean,
  ): string => {
    const decoratorString = decorators.join("\n")
    const optional = required ? "" : "?"
    return `${decoratorString} ${name}${optional}: ${type}`
  }

  const parameters: string[] = []
  const paramEntries = Object.entries(operation.parameters ?? {})
  const pathParams = new Set(operation.http?.params ?? [])
  for (const [name, prop] of paramEntries) {
    const decorators: string[] = []
    if (prop.description) {
      decorators.push('@doc("""')
      decorators.push(prop.description)
      decorators.push('""")')
    }
    if (pathParams.has(name)) {
      decorators.push("@path")
    }
    const type = renderType(prop.type)
    parameters.push(emitParameter(decorators, name, type, prop.required))
  }

  if (operation.requestBody) {
    const decorators: string[] = []
    if (operation.requestBody.description) {
      decorators.push('@doc("""')
      decorators.push(operation.requestBody.description)
      decorators.push('""")')
    }
    decorators.push("@body")

    parameters.push(
      emitParameter(
        decorators,
        "body",
        renderType(operation.requestBody.type),
        true,
      ),
    )
  }

  let returnType = "void"
  if (isHttpResponses(operation.returnType)) {
    returnType = operation.returnType.map(renderHttpResponse).join(" | ")
  } else if (isHttpResponse(operation.returnType)) {
    returnType = renderHttpResponse(operation.returnType)
  } else if (operation.returnType) {
    returnType = renderType(operation.returnType)
  }

  if (operation.summary) {
    lines.push(`@summary("${operation.summary}")`)
  }
  if (operation.description) {
    lines.push('@doc("""')
    lines.push(operation.description)
    lines.push('""")')
  }
  lines.push(`@route("${operation.route}")`)
  lines.push(`@${operation.method}`)
  lines.push(`op ${operation.name}(`)
  lines.push(parameters.join(", "))
  lines.push(`): ${returnType};`)

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

  const lines: string[] = []
  lines.push("{")
  for (const [name, prop] of Object.entries(type)) {
    const type = renderType(prop.type)
    const optional = prop.required ? "" : "?"
    if (prop.description) {
      lines.push('@doc("""')
      lines.push(prop.description)
      lines.push('""")')
    }
    lines.push(`${name}${optional}: ${type};`)
  }
  lines.push("}")
  return lines.join("\n")
}
