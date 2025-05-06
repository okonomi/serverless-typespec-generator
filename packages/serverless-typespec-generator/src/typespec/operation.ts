import dedent from "dedent"

type Response = {
  statusCode: number
  body: string
}

export type Operation = {
  name: string
  route: string
  method: string
  requestModel: string | null
  responseModels: Response[] | null
}

export function render(operation: Operation): string {
  let operationArguments = ""
  if (operation.requestModel) {
    operationArguments = `@body body: ${operation.requestModel}`
  }

  let operationReturn = "void"
  if (operation.responseModels) {
    operationReturn = dedent`
    {
      @statusCode statusCode: ${operation.responseModels[0].statusCode};
      @body body: ${operation.responseModels[0].body};
    }
    `
  }

  return [
    `@route("${operation.route}")`,
    `@${operation.method}`,
    `op ${operation.name}(${operationArguments}): ${operationReturn};`,
  ].join("\n")
}
