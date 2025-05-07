import dedent from "dedent"

type TypeReference = string

type OperationResponse = {
  statusCode: number
  type: TypeReference
}

export type Operation = {
  name: string
  route: string
  method: string
  requestModel: string | null
  returnType: TypeReference | OperationResponse[]
}

export function render(operation: Operation): string {
  let operationArguments = ""
  if (operation.requestModel) {
    operationArguments = `@body body: ${operation.requestModel}`
  }

  let operationReturn = "void"
  if (operation.returnType) {
    if (typeof operation.returnType === "string") {
      operationReturn = operation.returnType
    } else if (Array.isArray(operation.returnType)) {
      operationReturn = operation.returnType
        .map((model) => {
          return dedent`
          {
            @statusCode statusCode: ${model.statusCode};
            @body body: ${model.type};
          }
        `
        })
        .join(" | ")
    }
  }

  return [
    `@route("${operation.route}")`,
    `@${operation.method}`,
    `op ${operation.name}(${operationArguments}): ${operationReturn};`,
  ].join("\n")
}
