import dedent from "dedent"

type TypeReference = string

type OperationResponse = {
  statusCode: number
  type: TypeReference
}

export type Operation = {
  name: string

  body?: TypeReference
  returnType: TypeReference | OperationResponse[]

  http: {
    method: "get" | "post" | "put" | "delete" | "patch"
    path: string
  }
}

export function render(operation: Operation): string {
  let operationArguments = ""
  if (operation.body) {
    operationArguments = `@body body: ${operation.body}`
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
    `@route("${operation.http.path}")`,
    `@${operation.http.method}`,
    `op ${operation.name}(${operationArguments}): ${operationReturn};`,
  ].join("\n")
}
