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
  const lines: RenderLine[] = []
  lines.push({ indent, statement: name ? `model ${name} {` : "{" })
  lines.push(...renderProperties(schema.properties ?? {}, indent + 1))
  lines.push({ indent, statement: "}" })
  return lines
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
  if (detail.type === "object" && detail.properties) {
    const lines: RenderLine[] = []
    lines.push({ indent, statement: "{" })
    lines.push(...renderProperties(detail.properties, indent + 1))
    lines.push({ indent, statement: "}" })
    return lines
  }

  if (detail.type === "array" && detail.items) {
    // detail.items が配列でなく、かつオブジェクト型の場合のみ特別処理
    if (
      !Array.isArray(detail.items) &&
      detail.items.type === "object" &&
      detail.items.properties
    ) {
      const lines: RenderLine[] = []
      lines.push({ indent, statement: "{" })
      lines.push(...renderProperties(detail.items.properties, indent + 1))
      lines.push({ indent, statement: "}[]" })
      return lines
    }
    // それ以外は通常通り
    const itemLines = renderProperty(
      Array.isArray(detail.items) ? detail.items[0] : detail.items,
      indent,
    )
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

  return [{ indent, statement: `${detail.type}` }]
}
