import type { JSONSchema4 as JSONSchema } from "json-schema"

import { type RenderLine, rasterize } from "./../rendering"

export type Model = {
  name: string | null
  schema: JSONSchema
}

export function render(model: Model): string {
  const lines = renderModel(model.name, model.schema, 0)
  return rasterize(lines)
}

function renderModel(
  name: string | null,
  schema: JSONSchema,
  indent: number,
): RenderLine[] {
  return [
    { indent, statement: name ? `model ${name} {` : "{" },
    ...renderProperties(schema.properties ?? {}, indent + 1),
    { indent, statement: "}" },
  ]
}

function renderProperties(
  properties: Record<string, JSONSchema>,
  indent: number,
): RenderLine[] {
  return Object.entries(properties).flatMap(([k, v]) => {
    const propLines = renderProperty(v, indent)
    if (propLines.length === 1) {
      return [{ indent, statement: `${k}: ${propLines[0].statement};` }]
    }

    // 複数行（オブジェクトや多段配列など）の場合
    const [first, ...rest] = propLines
    return [
      { indent, statement: `${k}: ${first.statement}` },
      ...rest.slice(0, -1),
      {
        ...rest[rest.length - 1],
        statement: `${rest[rest.length - 1].statement};`,
      },
    ]
  })
}

function renderProperty(detail: JSONSchema, indent: number): RenderLine[] {
  // 配列型
  if (detail.type === "array" && detail.items) {
    const items = Array.isArray(detail.items) ? detail.items[0] : detail.items
    // 配列の要素がオブジェクト型
    if (items && items.type === "object" && items.properties) {
      return [
        { indent, statement: "{" },
        ...renderProperties(items.properties, indent + 1),
        { indent, statement: "}[]" },
      ]
    }
    // 配列の要素が配列型（多次元配列）やプリミティブ型
    const itemLines = renderProperty(items, indent)
    if (itemLines.length === 1) {
      return [{ indent, statement: `${itemLines[0].statement}[]` }]
    }
    // 多段配列や複雑な型の場合
    const [first, ...rest] = itemLines
    return [
      { indent, statement: `${first.statement}` },
      ...rest.slice(0, -1),
      {
        ...rest[rest.length - 1],
        statement: `${rest[rest.length - 1].statement}[]`,
      },
    ]
  }

  // オブジェクト型
  if (detail.type === "object" && detail.properties) {
    return [
      { indent, statement: "{" },
      ...renderProperties(detail.properties, indent + 1),
      { indent, statement: "}" },
    ]
  }

  // プリミティブ型
  return [{ indent, statement: `${detail.type}` }]
}
