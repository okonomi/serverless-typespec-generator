import { formatTypeSpec } from "@typespec/compiler"

async function normalizeTypeSpec(code: string) {
  const formattedCode = await formatTypeSpec(code, {
    indent: "  ",
    lineWidth: 80,
    trailingNewline: false,
  })
  return formattedCode.trimEnd()
}
