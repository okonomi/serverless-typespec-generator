import dedent from "dedent"

type TypeReference = string

export type Parameter = {
  name: string
  type: TypeReference
  required?: boolean
  decorators?: string[]
}

type OperationResponse = {
  statusCode: number
  type: TypeReference
}

export type Operation = {
  name: string

  pathParameters?: Parameter[]

  body?: TypeReference
  returnType: TypeReference | OperationResponse[]

  http: {
    method: "get" | "post" | "put" | "delete" | "patch"
    path: string
  }
}

export function render(operation: Operation): string {
  const parameters = []
  if (operation.pathParameters) {
    for (const param of operation.pathParameters) {
      parameters.push(`@path ${param.name}: ${param.type}`)
    }
  }
  if (operation.body) {
    parameters.push(`@body body: ${operation.body}`)
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
    `op ${operation.name}(${parameters.join(",")}): ${operationReturn};`,
  ].join("\n")
}
