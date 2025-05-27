import {
  type HttpResponseIR,
  type PropIR,
  type PropTypeIR,
  type PropsType,
  type TypeSpecAliasIR,
  type TypeSpecIR,
  type TypeSpecModelIR,
  type TypeSpecOperationIR,
  isArrayType,
  isHttpResponse,
  isHttpResponses,
  isPrimitiveType,
  isPropsType,
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
  return `alias ${alias.name} = ${emitPropType(alias.type)};`
}

export function emitModel(model: TypeSpecModelIR): string {
  return `model ${model.name} ${emitPropsType(model.props)};`
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
    const type = emitPropType(prop.type)
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
        emitPropType(operation.requestBody.type),
        true,
      ),
    )
  }

  let returnType = "void"
  if (isHttpResponses(operation.returnType)) {
    returnType = operation.returnType.map(emitHttpResponse).join(" | ")
  } else if (isHttpResponse(operation.returnType)) {
    returnType = emitHttpResponse(operation.returnType)
  } else if (operation.returnType) {
    returnType = emitPropType(operation.returnType)
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

function emitHttpResponse(r: HttpResponseIR): string {
  const body = emitPropType(r.body)
  return `{ @statusCode statusCode: ${r.statusCode}; @body body: ${body} }`
}

function emitPropType(type: PropTypeIR): string {
  if (isPrimitiveType(type)) {
    return type
  }

  if (isArrayType(type)) {
    return `${emitPropType(type[0])}[]`
  }

  if (isRefType(type)) {
    return type.__ref
  }

  if (isUnionType(type)) {
    return type.__union.map(emitPropType).join(" | ")
  }

  if (isPropsType(type)) {
    return emitPropsType(type)
  }

  throw new Error(`Unknown prop type: ${type}`)
}

function emitPropsType(props: PropsType): string {
  const lines: string[] = []
  lines.push("{")
  for (const [name, prop] of Object.entries(props)) {
    lines.push(emitProp(name, prop))
  }
  lines.push("}")
  return lines.join("\n")
}

function emitProp(name: string, prop: PropIR): string {
  const decorators: string[] = []
  if (prop.description) {
    decorators.push('@doc("""')
    decorators.push(prop.description)
    decorators.push('""")')
  }

  const decoratorString = decorators.join("\n")
  const optional = prop.required ? "" : "?"
  return `${decoratorString}\n${name}${optional}: ${emitPropType(prop.type)}`
}
