import type { JSONSchema4 as JSONSchema } from "json-schema"

export type Model = {
  name: string | null
  schema: JSONSchema
}

export function render(model: Model): string {
  const lines: string[] = []

  if (model.name === null) {
    lines.push("{")
  } else {
    lines.push(`model ${model.name} {`)
  }
  for (const [name, detail] of Object.entries(model.schema.properties ?? {})) {
    lines.push(`  ${name}: ${detail.type};`)
  }
  lines.push("}")

  return lines.join("\n")
}
