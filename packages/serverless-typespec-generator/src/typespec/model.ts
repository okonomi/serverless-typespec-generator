import type { JSONSchema4 as JSONSchema } from "json-schema"

export type Model = {
  name: string | null
  schema: JSONSchema
}

export function render(model: Model): string {
  const anonymous = model.name === null
  if (anonymous) {
    const props = model.schema.properties ?? {}
    const propStrs = Object.entries(props).map(
      ([name, detail]) => `${name}: ${renderProperty(detail)};`,
    )
    return `{ ${propStrs.join(" ")} }`
  }

  const lines: string[] = []
  lines.push(`model ${model.name} {`)
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
      if (rendered.startsWith("{")) {
        // Multi-line object
        lines.push(`${" ".repeat(indent)}${k}: ${rendered};`)
      } else {
        lines.push(`${" ".repeat(indent)}${k}: ${rendered};`)
      }
    }
    lines.push(`${" ".repeat(indent - 2)}}`)
    return lines.join("\n")
  }

  if (detail.type === "array" && detail.items) {
    // Optionally handle array of objects, but for now just 'array'
    return "array"
  }

  return `${detail.type}`
}
