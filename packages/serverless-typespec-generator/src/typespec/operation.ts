import dedent from "dedent"
import { type Model, render as renderModel } from "./model"
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
      let itemRendered = renderModel({
        name: null,
        schema: model.type.schema.items as JSONSchema,
      })
      itemRendered = extractBody(itemRendered, 2)
      return renderObjectLines(
        [
          `@statusCode statusCode: ${model.statusCode};`,
          `@body body: {\n${itemRendered}\n  }[];`,
        ],
        0,
      )
    }
    // Not array, just render as is
    let rendered = renderModel(model.type)
    rendered = extractBody(rendered, 2)
    return renderObjectLines(
      [
        `@statusCode statusCode: ${model.statusCode};`,
        `@body body: {\n${rendered}\n  };`,
      ],
      0,
    )
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

// handle anonymous model (object or array)
// model.type: { name: null, schema: ... }
// Use renderModel to get the inline type
// Helper to extract and indent the body of an anonymous model
function extractBody(modelStr: string, extraIndent = 2): string {
  // Remove leading/trailing whitespace and braces
  let lines = modelStr.trim().split("\n")
  if (lines[0].trim().startsWith("model ")) {
    lines[0] = lines[0].replace(/^model\s+\w+\s*\{/, "{")
  }
  if (lines[0].trim() === "{") lines = lines.slice(1)
  if (lines[lines.length - 1].trim() === "}") lines = lines.slice(0, -1)
  while (lines.length && !lines[0].trim()) lines.shift()
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop()
  // preserve original indent, add extraIndent (default 2 spaces)
  return lines
    .map((line) => {
      const match = line.match(/^(\s*)/)
      const base = match ? match[1].length : 0
      return line.trim() ? " ".repeat(base + extraIndent) + line.trim() : ""
    })
    .join("\n")
}
