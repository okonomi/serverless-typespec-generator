import { emitAlias, emitModel, emitOperation } from "../typespec/ir/emit"
import type { TypeSpecIR } from "../typespec/ir/type"

export function emitTypeSpec(irList: TypeSpecIR[]): string {
  const lines: string[] = []
  lines.push('import "@typespec/http";')
  lines.push("")
  lines.push("using Http;")
  lines.push("")

  lines.push('@service(#{ title: "Generated API" })')
  lines.push("namespace GeneratedApi;")
  lines.push("")

  for (const ir of irList) {
    lines.push(emitIR(ir))
    lines.push("")
  }

  return lines.join("\n")
}

export function emitIR(ir: TypeSpecIR): string {
  if (ir.kind === "model") {
    return emitModel(ir)
  }
  if (ir.kind === "alias") {
    return emitAlias(ir)
  }
  if (ir.kind === "operation") {
    return emitOperation(ir)
  }

  throw new Error(`Unknown IR: ${ir}`)
}
