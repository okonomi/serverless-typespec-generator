export type Operation = {
  name: string
  route: string
  method: string
  requestModel: string | null
  responseModel: string | null
}

export function render(operation: Operation): string {
  const lines: string[] = []

  lines.push(`@route("${operation.route}")`)
  lines.push(`@${operation.method}`)
  if (operation.requestModel) {
    lines.push(
      `op ${operation.name}(@body body: ${operation.requestModel}): ${operation.responseModel ?? "void"};`,
    )
  } else {
    lines.push(`op ${operation.name}(): ${operation.responseModel ?? "void"};`)
  }

  return lines.join("\n")
}
