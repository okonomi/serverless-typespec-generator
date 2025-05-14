import type Aws from "serverless/aws"
import { Registry } from "./registry"
import type { SLS } from "./types/serverless"
import { extractProps, jsonSchemaToTypeSpecIR } from "./typespec/ir/convert"
import { emitTypeSpec } from "./typespec/ir/emit"
import { NotImplementedError } from "./typespec/ir/error"
import type {
  HttpResponseIR,
  JSONSchema,
  OperationIR,
  PropIR,
  TypeSpecIR,
} from "./typespec/ir/type"

export function parseServerlessConfig(serverless: SLS): {
  operations: OperationIR[]
  models: Registry<TypeSpecIR>
} {
  const operations: OperationIR[] = []
  const models = new Registry<TypeSpecIR>()

  const apiGatewaySchemas =
    serverless.service.provider.apiGateway?.request?.schemas
  if (apiGatewaySchemas) {
    for (const [name, schema] of Object.entries(apiGatewaySchemas)) {
      try {
        const model = jsonSchemaToTypeSpecIR(schema.schema, schema.name ?? "")
        models.register(name, model)
      } catch (e: unknown) {
        if (e instanceof NotImplementedError) {
          console.warn(
            `Skipping schema "${name}" due to unsupported type: ${e.message}`,
          )
        } else {
          throw e
        }
      }
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
          pathParams?: {
            name: string
            schema: {
              type: "string"
            }
          }[]
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
      if (!isHttpMethod(method)) {
        continue
      }

      const parameters: Record<string, PropIR> = {}
      const httpParams: string[] = []
      if (http.documentation?.pathParams) {
        const pathParams = http.documentation.pathParams
        for (const { name, schema } of pathParams) {
          parameters[name] = {
            type: schema.type,
            required: true,
          }
          httpParams.push(name)
        }
      } else if (http.request?.parameters?.paths) {
        const paths = http.request.parameters.paths
        for (const [name, required] of Object.entries(paths)) {
          parameters[name] = {
            type: "string",
            required,
          }
          httpParams.push(name)
        }
      }

      let body = undefined
      const contentTypeSchema = http.request?.schemas?.["application/json"]
      if (contentTypeSchema) {
        if (typeof contentTypeSchema === "object") {
          const schema = contentTypeSchema as JSONSchema
          const name = schema.title ?? "" // TODO: generate a unique name
          models.register(name, jsonSchemaToTypeSpecIR(schema, name))
          body = name
        } else if (typeof contentTypeSchema === "string") {
          const model = models.get(contentTypeSchema)
          if (model) {
            body = model.name
          }
        }
      }

      const returnType: HttpResponseIR[] = []
      const methodResponses = http.documentation?.methodResponses
      if (methodResponses) {
        for (const methodResponse of methodResponses) {
          const contentTypeSchema =
            methodResponse.responseModels?.["application/json"]
          if (contentTypeSchema) {
            if (typeof contentTypeSchema === "object") {
              if (contentTypeSchema.type === "object") {
                const schema = contentTypeSchema
                const name = schema.title ?? null
                if (name) {
                  models.register(name, jsonSchemaToTypeSpecIR(schema, name))
                  returnType.push({
                    statusCode: methodResponse.statusCode,
                    body: { ref: name },
                  })
                } else {
                  returnType.push({
                    statusCode: methodResponse.statusCode,
                    body: extractProps(schema),
                  })
                }
              } else if (contentTypeSchema.type === "array") {
                const schema = contentTypeSchema
                if (!schema.items || Array.isArray(schema.items)) {
                  throw new Error("Invalid schema for array response")
                }
                const name = schema.items.title ?? null
                if (name) {
                  models.register(name, jsonSchemaToTypeSpecIR(schema, name))
                  returnType.push({
                    statusCode: methodResponse.statusCode,
                    body: { ref: name },
                  })
                } else {
                  returnType.push({
                    statusCode: methodResponse.statusCode,
                    body: [extractProps(schema.items)],
                  })
                }
              }
            } else if (typeof contentTypeSchema === "string") {
              const model = models.get(contentTypeSchema)
              if (model) {
                returnType.push({
                  statusCode: methodResponse.statusCode,
                  body: { ref: model.name },
                })
              }
            }
          }
        }
      }

      operations.push({
        kind: "operation",
        name: toCamelCase(functionName),
        method,
        route: `/${path}`,
        ...(Object.keys(parameters).length > 0 && { parameters }),
        ...(body && { requestBody: { ref: body } }),
        ...(returnType.length > 0 && { returnType }),
        ...(httpParams.length > 0 && { http: { params: httpParams } }),
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

export function renderDefinitions(irList: TypeSpecIR[]): string {
  const lines: string[] = []
  lines.push('import "@typespec/http";')
  lines.push("")
  lines.push("using Http;")
  lines.push("")

  lines.push('@service(#{ title: "Generated API" })')
  lines.push("namespace GeneratedApi;")
  lines.push("")

  for (const ir of irList) {
    lines.push(emitTypeSpec(ir))
    lines.push("")
  }

  return lines.join("\n")
}
