import type { JSONSchema4 as JSONSchema } from "json-schema"

export type Model = {
  name: string | null
  schema: JSONSchema
}

export function render(model: Model): string {
  return renderModel(model.name, model.schema)
}

function renderModel(name: string | null, schema: JSONSchema): string {
  const indentLevel = 0
  const header = name ? `model ${name} {` : "{"
  const body = renderProperties(schema.properties ?? {}, indentLevel + 1)
  return [header, body, `${indent(indentLevel)}}`].filter(Boolean).join("\n")
}

function renderProperties(
  properties: Record<string, JSONSchema>,
  indentLevel: number,
): string {
  return Object.entries(properties)
    .map(
      ([k, v]) =>
        `${indent(indentLevel)}${k}: ${renderProperty(v, indentLevel)};`,
    )
    .join("\n")
}

function renderProperty(detail: JSONSchema, indentLevel = 1): string {
  if (detail.type === "object" && detail.properties) {
    const lines: string[] = ["{"]
    lines.push(renderProperties(detail.properties, indentLevel + 1))
    lines.push(`${indent(indentLevel)}}`)
    return lines.join("\n")
  }

  if (detail.type === "array" && detail.items) {
    // detail.items が配列でなく、かつオブジェクト型の場合のみ特別処理
    if (
      !Array.isArray(detail.items) &&
      detail.items.type === "object" &&
      detail.items.properties
    ) {
      const lines: string[] = ["{"]
      lines.push(renderProperties(detail.items.properties, indentLevel + 1))
      lines.push(`${indent(indentLevel)}}[]`)
      return lines.join("\n")
    }
    // それ以外は通常通り
    const itemType = renderProperty(
      Array.isArray(detail.items) ? detail.items[0] : detail.items,
      indentLevel,
    )
    return `${itemType}[]`
  }

  return `${detail.type}`
}

function indent(level: number): string {
  return "  ".repeat(level)
}
