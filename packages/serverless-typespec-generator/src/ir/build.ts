import { Registry } from "./../registry"
import type { Serverless } from "./../types/serverless"
import { NotImplementedError } from "./error"
import type {
  ServerlessFunctionIR,
  ServerlessIR,
  ServerlessModelIR,
} from "./serverless/type"
import type {
  AliasIR,
  HttpResponseIR,
  JSONSchema,
  ModelIR,
  OperationIR,
  PropIR,
  PropTypeIR,
  TypeSpecIR,
} from "./type"

export function buildIR(serverless: Serverless): TypeSpecIR[] {
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

      const http = event.http
      if (typeof http === "string") {
        continue
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
            required:
              typeof required === "boolean"
                ? required
                : (required.required ?? false),
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

  return [...operations, ...Array.from(models.values())]
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

export function jsonSchemaToTypeSpecIR(
  schema: JSONSchema,
  name: string,
): AliasIR | ModelIR {
  if (schema.type === "array") {
    const type = convertType(schema)
    return { kind: "alias", name, type }
  }
  if (schema.type === "object" || schema.allOf) {
    const props = extractProps(schema)
    return { kind: "model", name, props }
  }

  throw new Error(`Unsupported schema type: ${schema.type}`)
}

export function extractProps(schema: JSONSchema): Record<string, PropIR> {
  if (schema.allOf) {
    return mergeAllOfObjectSchemas(schema.allOf)
  }

  const required = new Set(
    Array.isArray(schema.required) ? schema.required : [],
  )
  const props: Record<string, PropIR> = {}

  for (const [key, def] of Object.entries(schema.properties || {})) {
    props[key] = {
      type: convertType(def),
      required: required.has(key),
    }
  }

  return props
}

function mergeAllOfObjectSchemas(allOf: JSONSchema[]): Record<string, PropIR> {
  const required = new Set<string>()
  let props: Record<string, PropIR> = {}
  for (const subSchema of allOf) {
    if (subSchema.type !== "object") {
      throw new NotImplementedError(
        `Unsupported schema type in allOf: ${subSchema.type}`,
      )
    }
    if (Array.isArray(subSchema.required)) {
      for (const key of subSchema.required) {
        required.add(key)
      }
    }
    props = { ...props, ...extractProps(subSchema) }
  }
  for (const key of required) {
    if (key in props) {
      props[key].required = true
    }
  }
  return props
}

export function convertType(schema: JSONSchema): PropTypeIR {
  if (schema.oneOf) {
    const types = schema.oneOf.map(convertType)
    return { union: types }
  }

  if (schema.type === "object" || schema.allOf) {
    return extractProps(schema)
  }

  switch (schema.type) {
    case "string":
      return "string"
    case "integer":
      return "numeric"
    case "number":
      return "numeric"
    case "boolean":
      return "boolean"
    case "null":
      return "null"
    case "array":
      if (!schema.items || Array.isArray(schema.items)) {
        throw new Error("Array 'items' must be a single schema object")
      }
      return [convertType(schema.items)]
    default:
      throw new Error(`Unknown type: ${schema.type}`)
  }
}

export function buildTypeSpecIR(sls: ServerlessIR[]): TypeSpecIR[] {
  const modelRegistry = new Registry<TypeSpecIR>()

  // pass 1: build models
  const models = sls
    .filter((ir) => ir.kind === "model")
    .map((ir) => buildModelIR(ir, modelRegistry))

  // pass 2: build operations
  const operations = sls
    .filter((ir) => ir.kind === "function")
    .map((ir) => buildOperationIR(ir, modelRegistry))

  // pass 3: merge models and operations
  return [...operations, ...models]
}

export function buildModelIR(
  model: ServerlessModelIR,
  modelRegistry: Registry<TypeSpecIR>,
): ModelIR | AliasIR {
  const m = jsonSchemaToTypeSpecIR(model.schema, model.name)
  modelRegistry.register(model.key, m)
  return m
}

export function buildOperationIR(
  func: ServerlessFunctionIR,
  modelRegistry: Registry<TypeSpecIR>,
): OperationIR {
  const operation: OperationIR = {
    kind: "operation",
    name: func.name,
    method: func.event.method,
    route: func.event.path,
  }

  const request = func.event.request
  if (request) {
    const body = request.body
    if (body) {
      if (typeof body === "string") {
        operation.requestBody = { ref: modelRegistry.get(body)?.name ?? body }
      } else {
        if (body.title) {
          operation.requestBody = {
            ref: modelRegistry.get(body.title)?.name ?? body.title,
          }
        } else {
          operation.requestBody = convertType(body)
        }
      }
    }
    const pathParams = request.path
    if (pathParams) {
      operation.parameters = {}
      for (const [key, required] of Object.entries(pathParams)) {
        operation.parameters[key] = {
          type: "string",
          required,
        }
      }
      operation.http = {
        params: Object.keys(operation.parameters),
      }
    }
  }

  const responses = func.event.responses
  if (responses) {
    if (responses.every((res) => typeof res === "string")) {
      operation.returnType = {
        union: responses.map((res) => ({
          ref: modelRegistry.get(res)?.name ?? res,
        })),
      }
    } else {
      operation.returnType = responses.map((res) => {
        if (typeof res === "string") {
          return {
            statusCode: 200,
            body: { ref: modelRegistry.get(res)?.name ?? res },
          }
        }
        if (typeof res.body === "string") {
          return {
            statusCode: res.statusCode,
            body: { ref: modelRegistry.get(res.body)?.name ?? res.body },
          }
        }
        if (res.body.title) {
          return {
            statusCode: res.statusCode,
            body: {
              ref: modelRegistry.get(res.body.title)?.name ?? res.body.title,
            },
          }
        }
        return {
          statusCode: res.statusCode,
          body: convertType(res.body),
        }
      })
    }
  }

  return operation
}
