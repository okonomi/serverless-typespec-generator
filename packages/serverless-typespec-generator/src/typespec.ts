import type Aws from "serverless/aws"
import type { JSONSchema4 as JSONSchema } from "json-schema"

import type { SLS } from "./types/serverless"
import { type Operation, render as renderOperation } from "./typespec/operation"
import { type Model, render as renderModel } from "./typespec/model"
import { Registry } from "./registry"

export function parseServerlessConfig(serverless: SLS): {
  operations: Operation[]
  models: Registry<Model>
} {
  const operations: Operation[] = []
  const models = new Registry<Model>()

  const apiGatewaySchemas =
    serverless.service.provider.apiGateway?.request?.schemas
  if (apiGatewaySchemas) {
    for (const [name, schema] of Object.entries(apiGatewaySchemas)) {
      const model = {
        name: schema.name ?? "", // TODO: generate a unique name
        schema: schema.schema,
      }

      models.register(name, model)
    }
  }

  for (const functionName of serverless.service.getAllFunctions()) {
    const events = serverless.service.getAllEventsInFunction(functionName)
    for (const event of events) {
      if (!("http" in event)) {
        continue
      }

      const http = event.http as Aws.Http & {
        documentation?: {
          methodResponses?: {
            statusCode: number
            responseModels?: {
              "application/json": JSONSchema | string
            }
          }[]
        }
      }

      const method = http.method.toLowerCase()
      const path = http.path.replace(/^\/|\/$/g, "")

      let requestModel = null
      if (http.request?.schemas?.["application/json"]) {
        const contentTypeSchema = http.request.schemas["application/json"]
        if (typeof contentTypeSchema === "object") {
          const schema = contentTypeSchema as JSONSchema
          const name = schema.title ?? "" // TODO: generate a unique name
          models.register(name, { name, schema })
          requestModel = name
        } else if (typeof contentTypeSchema === "string") {
          const model = models.get(contentTypeSchema)
          if (model) {
            requestModel = model.name
          }
        }
      }

      const returnType = []
      if (http.documentation?.methodResponses) {
        const methodResponses = http.documentation.methodResponses
        for (const methodResponse of methodResponses) {
          if (methodResponse.responseModels?.["application/json"]) {
            const contentTypeSchema =
              methodResponse.responseModels["application/json"]
            if (typeof contentTypeSchema === "object") {
              const schema = contentTypeSchema
              const name = schema.title ?? "" // TODO: generate a unique name
              models.register(name, { name, schema })
              returnType.push({
                statusCode: methodResponse.statusCode,
                type: name,
              })
            } else if (typeof contentTypeSchema === "string") {
              const model = models.get(contentTypeSchema)
              if (model) {
                returnType.push({
                  statusCode: methodResponse.statusCode,
                  type: model.name,
                })
              }
            }
          }
        }
      }

      operations.push({
        name: toCamelCase(functionName),
        route: `/${path}`,
        method,
        requestModel,
        returnType: returnType.length > 0 ? returnType : "void",
      })
    }
  }

  return {
    operations,
    models,
  }
}

function toCamelCase(str: string): string {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toLowerCase())
}

export function renderDefinitions(
  operations: Operation[],
  models: Registry<Model>,
): string {
  const lines: string[] = []
  lines.push('import "@typespec/http";')
  lines.push("")
  lines.push("using Http;")
  lines.push("")

  lines.push('@service(#{ title: "Generated API" })')
  lines.push("namespace GeneratedApi;")
  lines.push("")

  for (const operation of operations) {
    lines.push(renderOperation(operation))
    lines.push("")
  }

  for (const model of models.values()) {
    lines.push(renderModel(model))
    lines.push("")
  }

  return lines.join("\n")
}
