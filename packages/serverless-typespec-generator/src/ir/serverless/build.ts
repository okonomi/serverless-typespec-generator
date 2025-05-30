import type { Serverless } from "~/types/serverless"
import type {
  ServerlessFunctionIR,
  ServerlessIR,
  ServerlessModelIR,
} from "./type"

export function buildServerlessIR(serverless: Serverless): ServerlessIR[] {
  const irList: ServerlessIR[] = []

  const models = serverless.service.provider.apiGateway?.request?.schemas
  if (models) {
    for (const [key, m] of Object.entries(models)) {
      const model: ServerlessModelIR = {
        kind: "model",
        key,
        name: m.name ?? m.schema.title ?? key,
        schema: m.schema,
      }
      irList.push(model)
    }
  }

  for (const functionName of serverless.service.getAllFunctions()) {
    const events = serverless.service.getAllEventsInFunction(functionName)
    const event = events.find((event) => "http" in event && event.http)
    if (!event) {
      // TODO: logging
      continue
    }
    if (!("http" in event) || !event.http) {
      // TODO: logging
      continue
    }

    const http = event.http

    if (typeof http === "string") {
      // TODO: logging
      continue
    }

    if (!isHttpMethod(http.method)) {
      // TODO: logging
      continue
    }

    const func: ServerlessFunctionIR = {
      kind: "function",
      name: normalizeFunctionName(functionName),
      event: {
        method: http.method,
        path: normalizePath(http.path),
      },
    }

    const request = http.request
    if (request) {
      func.event.request ??= {}

      const requestSchema = request.schemas?.["application/json"]
      if (requestSchema) {
        if (typeof requestSchema === "string") {
          func.event.request.body = { schema: requestSchema }
        } else if (requestSchema.title) {
          func.event.request.body = { schema: requestSchema.title }
          irList.push({
            kind: "model",
            key: requestSchema.title as string,
            name: requestSchema.title as string,
            schema: requestSchema,
          })
        } else {
          func.event.request.body = { schema: requestSchema }
        }
      }

      const requestPaths = request.parameters?.paths
      if (requestPaths) {
        func.event.request.path ??= {}
        for (const [key, value] of Object.entries(requestPaths)) {
          func.event.request.path[key] = {
            required:
              typeof value === "object" ? (value.required ?? false) : true,
          }
        }
      }
    }

    if (http.documentation?.summary) {
      func.event.summary = http.documentation.summary
    }

    if (http.documentation?.description) {
      func.event.description = http.documentation.description
    }

    const pathParams = http.documentation?.pathParams
    if (pathParams) {
      func.event.request ??= {}
      func.event.request.path ??= {}
      for (const param of pathParams) {
        func.event.request.path[param.name] = { required: true }
        if (param.description) {
          func.event.request.path[param.name].description = param.description
        }
      }
    }

    const requestBody = http.documentation?.requestBody
    if (requestBody) {
      if (!func.event?.request?.body) {
        throw new Error(
          `${functionName} has requestBody but no request body defined`,
        )
      }
      if (requestBody.description) {
        func.event.request.body.description = requestBody.description
      }
    }

    const responses = http.documentation?.methodResponses
    if (responses) {
      func.event.responses = []
      for (const res of responses) {
        const statusCode = res.statusCode
        const model = res.responseModels?.["application/json"]
        if (model) {
          if (typeof model === "string") {
            func.event.responses.push({
              statusCode,
              body: model,
            })
          } else {
            if (model.title) {
              func.event.responses.push({
                statusCode,
                body: model.title,
              })
              irList.push({
                kind: "model",
                key: model.title,
                name: model.title,
                schema: model,
              })
            } else {
              func.event.responses.push({
                statusCode,
                body: model,
              })
            }
          }
        }
      }
    }

    irList.push(func)
  }

  return irList
}

function isHttpMethod(
  method: string,
): method is "get" | "post" | "put" | "delete" | "patch" {
  return (
    method === "get" ||
    method === "post" ||
    method === "put" ||
    method === "delete" ||
    method === "patch"
  )
}

function normalizePath(path: string) {
  if (!path.startsWith("/")) {
    return `/${path}`
  }

  return path
}

function normalizeFunctionName(name: string) {
  return toCamelCase(name)
}

function toCamelCase(str: string) {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toLowerCase())
}
