import type {
  ServerlessFunctionIR,
  ServerlessIR,
  ServerlessModelIR,
} from "~/ir/serverless/type"
import { Registry } from "~/registry"
import type { JSONSchema } from "~/types/json-schema"
import { NotImplementedError } from "./error"
import type {
  PropTypeIR,
  PropsType,
  TypeSpecAliasIR,
  TypeSpecIR,
  TypeSpecModelIR,
  TypeSpecOperationIR,
} from "./type"

export function jsonSchemaToTypeSpecIR(
  schema: JSONSchema,
  name: string,
): TypeSpecAliasIR | TypeSpecModelIR {
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

export function extractProps(schema: JSONSchema): PropsType {
  if (schema.allOf) {
    return mergeAllOfObjectSchemas(schema.allOf)
  }

  const required = new Set(
    Array.isArray(schema.required) ? schema.required : [],
  )
  const props: PropsType = {}

  for (const [key, def] of Object.entries(schema.properties || {})) {
    props[key] = {
      type: convertType(def),
      required: required.has(key),
    }
    if (def.description) {
      props[key].description = def.description
    }
  }

  return props
}

function mergeAllOfObjectSchemas(allOf: JSONSchema[]): PropsType {
  const required = new Set<string>()
  let props: PropsType = {}
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
): TypeSpecModelIR | TypeSpecAliasIR {
  const m = jsonSchemaToTypeSpecIR(model.schema, model.name)
  modelRegistry.register(model.key, m)
  return m
}

export function buildOperationIR(
  func: ServerlessFunctionIR,
  modelRegistry: Registry<TypeSpecIR>,
): TypeSpecOperationIR {
  const modelRef = (key: string): string => {
    return modelRegistry.get(key)?.name ?? key
  }

  const operation: TypeSpecOperationIR = {
    kind: "operation",
    name: func.name,
    method: func.event.method,
    route: func.event.path,
  }

  if (func.event.summary) {
    operation.summary = func.event.summary
  }

  if (func.event.description) {
    operation.description = func.event.description
  }

  const request = func.event.request
  if (request) {
    const body = request.body
    if (body) {
      if (typeof body.schema === "string") {
        operation.requestBody = {
          type: { ref: modelRef(body.schema) },
          required: true,
        }
      } else {
        operation.requestBody = {
          type: convertType(body.schema),
          required: true,
        }
      }
      if (body.description) {
        operation.requestBody.description = body.description
      }
    }
    const pathParams = request.path
    if (pathParams) {
      operation.parameters = {}
      for (const [key, { required, description }] of Object.entries(
        pathParams,
      )) {
        operation.parameters[key] = {
          type: "string",
          required,
          ...(description ? { description } : {}),
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
        union: responses.map((res) => ({ ref: modelRef(res) })),
      }
    } else {
      operation.returnType = responses.map((res) => {
        if (typeof res === "string") {
          return {
            statusCode: 200, // TODO: handle status code
            body: { ref: modelRef(res) },
          }
        }
        if (typeof res.body === "string") {
          return {
            statusCode: res.statusCode,
            body: { ref: modelRef(res.body) },
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
