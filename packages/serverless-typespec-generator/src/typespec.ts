import type Serverless from "serverless"
import type Aws from "serverless/plugins/aws/provider/awsProvider"
import type { JSONSchema4 as JSONSchema } from "json-schema"

type Operation = {
  name: string
  route: string
  method: string
  requestModel: string | null
  responseModel: string | null
}

type Model = {
  name: string
  schema: JSONSchema
}

export function parseServerlessConfig(serverless: Serverless): {
  operations: Operation[]
  models: Map<string, Model>
} {
  const operations: Operation[] = []
  const models: Map<string, Model> = new Map()

  const functions = serverless.service.functions
  for (const [functionName, functionConfig] of Object.entries(functions)) {
    const events = functionConfig.events || []
    for (const event of events) {
      if (!event.http) {
        continue
      }

      const http = event.http as Aws.Http & {
        typespec?: {
          response?: {
            schemas?: {
              "application/json": {
                [key: string]: JSONSchema
              }
            }
          }
        }
      }

      const method = http.method.toLowerCase()
      const path = http.path.replace(/^\/|\/$/g, "")

      let requestModel = null
      if (http.request?.schemas?.["application/json"]) {
        const schema = http.request.schemas["application/json"] as JSONSchema
        const name = schema.title ?? "" // TODO: generate a unique name
        models.set(name, { name, schema })

        requestModel = name
      }

      let responseModel = null
      if (http.typespec?.response?.schemas?.["application/json"]) {
        const schema = http.typespec.response.schemas["application/json"]["200"]
        const name = schema.title ?? "" // TODO: generate a unique name
        models.set(name, { name, schema })

        responseModel = name
      }

      operations.push({
        name: functionName,
        route: `/${path}`,
        method,
        requestModel,
        responseModel,
      })
    }
  }

  return {
    operations,
    models,
  }
}

export function renderDefinitions(
  operations: Operation[],
  models: Map<string, Model>,
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
    lines.push(`@route("${operation.route}")`)
    lines.push(`@${operation.method}`)
    if (operation.requestModel) {
      lines.push(
        `op ${operation.name}(@body body: ${operation.requestModel}): ${operation.responseModel ?? "void"};`,
      )
    } else {
      lines.push(
        `op ${operation.name}(): ${operation.responseModel ?? "void"};`,
      )
    }
    lines.push("")
  }

  for (const [modelName, model] of models) {
    lines.push(`model ${modelName} {`)
    for (const [name, detail] of Object.entries(
      model.schema.properties ?? {},
    )) {
      lines.push(`  ${name}: ${detail.type};`)
    }
    lines.push("}")
    lines.push("")
  }

  return lines.join("\n")
}
