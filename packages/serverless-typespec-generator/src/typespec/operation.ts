import dedent from "dedent"
import { type Model, renderModel } from "./model"
import type { JSONSchema4 as JSONSchema } from "json-schema"
import { rasterize, type RenderLine } from "../rendering"

type TypeReference = string

export type Parameter = {
  name: string
  type: TypeReference
  required?: boolean
  decorators?: string[]
}

type OperationResponse = {
  statusCode: number
  type: TypeReference | Model
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
  const decoratorLines = renderDecoratorLines(operation)
  const parameters = renderParameters(operation)
  const returnType = renderReturnType(operation.returnType)

  const lines: RenderLine[] = [
    ...decoratorLines,
    {
      indent: 0,
      statement: `op ${operation.name}(${parameters}): ${returnType};`,
    },
  ]

  return rasterize(lines)
}

function renderDecoratorLines(operation: Operation): RenderLine[] {
  return [
    { indent: 0, statement: `@route("${operation.http.path}")` },
    { indent: 0, statement: `@${operation.http.method}` },
  ]
}

function renderParameters(operation: Operation): string {
  const parameters: string[] = []
  if (operation.pathParameters) {
    for (const param of operation.pathParameters) {
      parameters.push(`@path ${param.name}: ${param.type}`)
    }
  }
  if (operation.body) {
    parameters.push(`@body body: ${operation.body}`)
  }
  return parameters.join(", ")
}

function renderSingleResponseLines(model: OperationResponse): RenderLine[] {
  if (typeof model.type === "string") {
    return renderObjectLines(
      [
        `@statusCode statusCode: ${model.statusCode};`,
        `@body body: ${model.type};`,
      ],
      0,
    )
  }
  if (typeof model.type === "object") {
    if (model.type.schema.type === "array") {
      // Array of anonymous object
      const itemRendered = renderModel(
        null,
        model.type.schema.items as JSONSchema,
        0,
      )

      return [
        { indent: 0, statement: "{" },
        {
          indent: 1,
          statement: `@statusCode statusCode: ${model.statusCode};`,
        },
        { indent: 1, statement: "@body body: {" },
        {
          indent: 1,
          statement: itemRendered.filter(
            (l) => l.statement !== "{" && l.statement !== "}",
          ),
        },
        { indent: 1, statement: "}[];" },
        { indent: 0, statement: "}" },
      ]
    }
    // Not array, just render as is
    const rendered = renderModel(model.type.name, model.type.schema, 0)
    return [
      { indent: 0, statement: "{" },
      {
        indent: 1,
        statement: `@statusCode statusCode: ${model.statusCode};`,
      },
      { indent: 1, statement: "@body body: {" },
      {
        indent: 1,
        statement: rendered.filter(
          (l) => l.statement !== "{" && l.statement !== "}",
        ),
      },
      { indent: 1, statement: "};" },
      { indent: 0, statement: "}" },
    ]
  }

  return []
}

function renderObjectLines(body: string[], indent: number): RenderLine[] {
  return [
    { indent, statement: "{" },
    ...body.map((line) => ({ indent: indent + 1, statement: line })),
    { indent, statement: "}" },
  ]
}

function renderReturnType(returnType: Operation["returnType"]): string {
  if (!returnType) return "void"
  if (Array.isArray(returnType)) {
    return returnType
      .map((model) => rasterize(renderSingleResponseLines(model)))
      .join(" | ")
  }
  return returnType
}
