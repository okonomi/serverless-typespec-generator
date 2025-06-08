import {
  type HttpResponseIR,
  type PropIR,
  type PropTypeIR,
  type PropsType,
  type TypeSpecAliasIR,
  type TypeSpecIR,
  type TypeSpecModelIR,
  type TypeSpecOperationIR,
  type TypeSpecServiceIR,
  isArrayType,
  isFormatType,
  isHttpResponse,
  isHttpResponses,
  isLiteralType,
  isPatternType,
  isPrimitiveType,
  isPropsType,
  isRefType,
  isUnionType,
} from "./type"

export function emitTypeSpecHeader(): string {
  return [
    'import "@typespec/http";',
    'import "@typespec/versioning";',
    "",
    "using Http;",
    "using Versioning;",
    "",
  ].join("\n")
}

export function emitTypeSpec(irList: TypeSpecIR[]): string {
  const lines: string[] = []

  for (const ir of irList) {
    lines.push(emitIR(ir))
    lines.push("")
  }

  return lines.join("\n")
}

export function emitIR(ir: TypeSpecIR): string {
  if (ir.kind === "service") {
    return emitService(ir)
  }
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

export function emitService(service: TypeSpecServiceIR): string {
  const lines: string[] = []

  lines.push(`@service(#{ title: "${service.title}" })`)
  if (service.description) {
    lines.push('@doc("""')
    lines.push(service.description)
    lines.push('""")')
  }
  lines.push("@versioned(Versions)")
  lines.push("namespace GeneratedApi;")
  lines.push("")
  lines.push("enum Versions {")
  lines.push(`  v1: "${service.version}",`)
  lines.push("}")
  lines.push("")

  return lines.join("\n")
}

export function emitAlias(alias: TypeSpecAliasIR): string {
  return `alias ${alias.name} = ${emitPropType(alias.type)};`
}

export function emitModel(model: TypeSpecModelIR): string {
  return `model ${model.name} ${emitPropsType(model.props)};`
}

export function emitOperation(operation: TypeSpecOperationIR): string {
  const lines: string[] = []

  const parameters: string[] = []
  const paramEntries = Object.entries(operation.parameters ?? {})
  const pathParams = new Set(operation.http?.params ?? [])
  for (const [name, prop] of paramEntries) {
    const decorators: string[] = []
    if (pathParams.has(name)) {
      decorators.push("@path")
    }
    parameters.push(emitProp(name, prop, decorators))
  }

  if (operation.requestBody) {
    parameters.push(emitProp("body", operation.requestBody, ["@body"]))
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

  if (isLiteralType(type)) {
    return JSON.stringify(type.__literal)
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

function emitProp(
  name: string,
  prop: PropIR,
  additionalDecorators?: string[],
): string {
  const decorators: string[] = []
  if (prop.description) {
    decorators.push('@doc("""')
    decorators.push(prop.description)
    decorators.push('""")')
  }

  const { decorators: propDecorators, type: baseType } = unwrapDecorators(
    prop.type,
  )

  const decoratorString = [
    ...decorators,
    ...propDecorators,
    ...(additionalDecorators ?? []),
  ].join("\n")
  const optional = prop.required ? "" : "?"
  return `${decoratorString}\n${name}${optional}: ${emitPropType(baseType)}`
}

function unwrapDecorators(t: PropTypeIR): {
  decorators: string[]
  type: PropTypeIR
} {
  if (isUnionType(t)) {
    // process each variant recursively
    const variants = t.__union
    const collectedDecs: string[] = []
    const strippedVariants: PropTypeIR[] = variants.map((v) => {
      const { decorators: decs, type: base } = unwrapDecorators(v)
      collectedDecs.push(...decs)
      return base
    })
    // remove duplicates
    const uniqueDecs = Array.from(new Set(collectedDecs))
    return {
      decorators: uniqueDecs,
      type: { __union: strippedVariants },
    }
  }

  const decorators: string[] = []
  let baseType: PropTypeIR = t
  if (isFormatType(t)) {
    baseType = t.type
    decorators.push(`@format("${t.__format}")`)
  }

  if (isPatternType(t)) {
    return {
      decorators: [`@pattern("${escapeRegExp(t.__pattern)}")`],
      type: t.type,
    }
  }

  return { decorators, type: baseType }
}

function escapeRegExp(str: string): string {
  return str.replace(/\\/g, "\\\\")
}
