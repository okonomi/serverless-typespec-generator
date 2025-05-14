import { emitTypeSpec } from "./typespec/ir/emit"
import type { TypeSpecIR } from "./typespec/ir/type"

export function renderDefinitions(irList: TypeSpecIR[]): string {
  const lines: string[] = []
  lines.push('import "@typespec/http";')
  lines.push("")
  lines.push("using Http;")
  lines.push("")

  lines.push('@service(#{ title: "Generated API" })')
  lines.push("namespace GeneratedApi;")
  lines.push("")

  for (const ir of irList) {
    lines.push(emitTypeSpec(ir))
    lines.push("")
  }

  return lines.join("\n")
}
