import dedent from "dedent"

export type Operation = {
  name: string
  route: string
  method: string
  requestModel: string | null
  responseModel: string | null
}

export function render(operation: Operation): string {
  let operationArguments = ""
  if (operation.requestModel) {
    operationArguments = `@body body: ${operation.requestModel}`
  }

  let operationReturn = "void"
  if (operation.responseModel) {
    operationReturn = dedent`
    {
      @statusCode statusCode: 201;
      @body body: ${operation.responseModel};
    }
    `
  }

  return [
    `@route("${operation.route}")`,
    `@${operation.method}`,
    `op ${operation.name}(${operationArguments}): ${operationReturn};`,
  ].join("\n")
}
