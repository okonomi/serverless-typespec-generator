import type { JSONSchema4 as JSONSchema } from "json-schema"

export type Model = {
  name: string | null
  schema: JSONSchema
}

export function render(model: Model): string {
  const lines: string[] = []
  if (model.name) {
    lines.push(`model ${model.name} {`)
  } else {
    lines.push("{")
  }
  for (const [name, detail] of Object.entries(model.schema.properties ?? {})) {
    const rendered = renderProperty(detail, 4)
    if (rendered.startsWith("{")) {
      // Multi-line object
      lines.push(`  ${name}: ${rendered};`)
    } else {
      lines.push(`  ${name}: ${rendered};`)
    }
  }
  lines.push("}")
  return lines.join("\n")
}

function renderProperty(detail: JSONSchema, indent = 2): string {
  if (detail.type === "object" && detail.properties) {
    const lines: string[] = ["{"]
    for (const [k, v] of Object.entries(detail.properties)) {
      const rendered = renderProperty(v, indent + 2)
      lines.push(`${" ".repeat(indent)}${k}: ${rendered};`)
    }
    lines.push(`${" ".repeat(indent - 2)}}`)
    return lines.join("\n")
  }

  if (detail.type === "array" && detail.items) {
    // Render array item type
    const itemType = renderProperty(detail.items as JSONSchema, indent)
    // If itemType is multi-line (object), wrap in parentheses
    if (itemType.startsWith("{")) {
      return `${itemType}[]`
    }
    return `${itemType}[]`
  }

  return `${detail.type}`
}
